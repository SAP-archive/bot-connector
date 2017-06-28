import is from 'is_js'
import md5 from 'blueimp-md5'
import { createHmac } from 'crypto'
import request from 'request'
import Twit from 'twit'
import fileType from 'file-type'
import http from 'http'
import fs from 'fs'
import request2 from 'superagent'
import tmp from 'tmp'

export function getWebhookToken (id, slug) {
  return md5(id.toString().split('').reverse().join(''), slug)
}

export function getTwitterWebhookToken (first, second) {
  const hmac = createHmac('sha256', first)
  hmac.update(second)
  return 'sha256='.concat(hmac.digest('base64'))
}

export function deleteTwitterWebhook (T, webhookToken) {
  return new Promise((resolve, reject) => {
    T._buildReqOpts('DELETE', 'account_activity/webhooks/'.concat(webhookToken), {}, false, (err, reqOpts) => {
      if (err) {
        reject(err)
        return
      }
      T._doRestApiRequest(reqOpts, {}, 'DELETE', (err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  })
}

export function getFileType (url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      res.once('data', chunk => {
        res.destroy()
        resolve(fileType(chunk))
      })
      res.once('error', () => { reject(new Error('could not get file type')) })
    })
  })
}

// We can return the media_id before we upload the file,
// but if there is an error while uploading, we can't handle it as easily
export function postMediaToTwitterFromUrl (channel, url) {
  return new Promise((resolve, reject) => {
    const T = new Twit({
      consumer_key: channel.consumerKey,
      consumer_secret: channel.consumerSecret,
      access_token: channel.accessToken,
      access_token_secret: channel.accessTokenSecret,
      timeout_ms: 60 * 1000,
    })

    request.head(url, (err, res) => {
      if (err) {
        return reject(err)
      }
      const length = parseInt(res.headers['content-length'], 10)
      // max 15 MB imposed by twitter
      if (length > 15 * 1024 * 1024) {
        return reject(new Error('media too large, 15 MB limit'))
      }
      const parts = url.split('.')
      const extension = '.'.concat(parts[parts.length - 1])
      let tmpfile = null
      try {
        tmpfile = tmp.fileSync({ postfix: extension })
      } catch (err2) {
        return reject(err2)
      }
      request2.get(url).end((err, res) => {
        if (err) {
          return reject(err)
        }
        const content = res.body
        try {
          fs.writeFileSync(tmpfile.name, content, { encoding: 'binary' })
        } catch (err3) {
          return reject(err3)
        }
        T.postMediaChunked({ file_path: tmpfile.name }, (err, data) => {
          tmpfile.removeCallback()
          if (err) {
            return reject(err)
          }
          resolve(data.media_id_string)
        })
      })
    })
  })
}

export function noop () {
  return Promise.resolve()
}

/**
 * Invoke an async service method
 */
export async function invoke (serviceName, methodName, args) {
  return global.services[serviceName][methodName](...args)
}

/**
 * Invoke a sync service method
 */
export function invokeSync (serviceName, methodName, args) {
  return global.services[serviceName][methodName](...args)
}

/**
 * Check if an url is valid
 */
export const isInvalidUrl = url => (!url || (!is.url(url) && !(/localhost/).test(url)))

export const arrayfy = (content) => [].concat.apply([], [content])
