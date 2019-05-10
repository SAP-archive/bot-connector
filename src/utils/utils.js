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
import kue from 'kue'
import _ from 'lodash'
import { Message, Participant } from '../models'
import { logger } from './index'
import messageQueue from './message_queue'

export function getWebhookToken (id, slug) {
  return md5(id.toString().split('').reverse().join(''), slug)
}

export function getTwitterWebhookToken (first, second) {
  const hmac = createHmac('sha256', first)
  hmac.update(second)
  return 'sha256='.concat(hmac.digest('base64'))
}

export function deleteTwitterWebhook (T, webhookToken, envName) {
  T.config.app_only_auth = false
  return new Promise((resolve, reject) => {
    T._buildReqOpts('DELETE',
      `account_activity/all/${envName}/webhooks/${webhookToken}`, {}, false, (err, reqOpts) => {
        if (err) { return reject(err) }
        T._doRestApiRequest(reqOpts, {}, 'DELETE', (err) => {
          if (err) { return reject(err) }
          return resolve()
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
 * Check if an url is valid
 */
export const isInvalidUrl = url => (!url || (!is.url(url) && !(/localhost/).test(url)))

export const arrayfy = (content) => [].concat.apply([], [content])

export function sendToWatchers (convId, msgs) {
  return new Promise((resolve, reject) => {
    messageQueue.getQueue().create(convId, msgs)
      .save(err => {
        if (err) { return reject(err) }
        resolve()
      })
  })
}

export function removeOldRedisMessages () {
  const now = Date.now()
  // -1 means that we don't limit the number of results, we could set that to 1000
  kue.Job.rangeByState('inactive', 0, -1, 'asc', (err, messages) => {
    if (err) { return logger.error(`Error while getting messages from Redis: ${err}`) }
    messages.forEach(msg => {
      if (now - msg.created_at > 10 * 1000) { msg.remove() }
    })
  })
}

export async function findUserRealName (conversation) {
  const participants = await Participant.find({ conversation: conversation._id })
  const users = participants.filter(p => !p.isBot && !p.type === 'agent')
  if (users.length === 0) {
    return `Anonymous user from ${conversation.channel.type}`
  }
  const user = users[0]

  if (user && user.data && user.data.userName) {
    return user.userName
  }
  if (user && user.data && user.data.first_name && user.data.last_name) {
    return `${user.data.first_name} ${user.data.last_name}`
  }
  return `Anonymous user from ${conversation.channel.type}`
}

export async function messageHistory (conversation) {
  const lastMessages = await Message
    .find({ conversation: conversation._id })
    .sort({ receivedAt: -1 })
    .populate('participant')
    .exec()

  return lastMessages
}

export function formatMessageHistory (history) {
  return history
    .map(m => {
      const message = formatUserMessage(m)
      switch (m.participant.type) {
      case 'bot':
        return `<b>Bot</b>: ${message}`
      case 'agent':
        return `<b>Agent</b>: ${message}`
      default:
        return `<b>User</b>: ${message}`
      }
    })
    .concat('This is the history of the conversation between the user and the bot:')
    .reverse()
}

export function formatUserMessage (message) {
  switch (message.attachment.type) {
  case 'text':
    return message.attachment.content
  case 'picture':
    return '[Image]'
  default:
    return '[Rich message]'
  }
}

export function formatMarkdownHelper (message, linkMarkdown = false, boldItalicMarkdown = true) {
  const applyRegex = (content) => {
    const starsToHash = (result) => result.replace(/\*\*/gm, '#7Uk0I2smS')
    const underscoresToHash = (result) => result.replace(/__/gm, '#7Uk0I2smS')
    const modifySingleStars = (result) => result.replace(/^\*|\*$/gm, '_')
    const modifyDoubleStars = (result) => result.replace(/^\*\*|\*\*([^*]|$)/gm, starsToHash)
    const modifyDoubleUnderscores = (result) => result.replace(/^__|__([^_]|$)/gm, underscoresToHash)
    const modifyTextLink = (result) => result.replace(/\[|\]/g, ' ')
    const modifyEmptyLink = (result) => result.replace(/\(|\)|\[|\]/g, '')
    const modifyStarsSpace = (result) => result.replace(/\*[\s]+|[\s]+\*/gm, '*')
    const modifyUnderscoresSpace = (result) => result.replace(/_[\s]+|[\s]+_/gm, '_')
    const modifyDoubleStarsSpace = (result) => result.replace(/\*\*[\s]+|[\s]+\*\*/gm, '**')
    const modifyDoubleUnderscoresSpace = (result) => result.replace(/__[\s]+|[\s]+__/gm, '__')
    let formattedContent = content
    if (boldItalicMarkdown) {
      formattedContent = formattedContent
        .replace(/\*\*(.*?)\*\*([^*]|$)/gm, modifyDoubleStars)
        .replace(/__(.*?)__([^_]|$)/gm, modifyDoubleUnderscores)
        .replace(/\*(.*?)\*/gm, modifySingleStars)
        .replace(/#7Uk0I2smS/gm, '*')
    }
    if (linkMarkdown) {
      formattedContent = formattedContent
        .replace(/\[.+\]\(.*\)/gm, modifyTextLink)
        .replace(/\[\]\(.*\)/g, modifyEmptyLink)
    }
    return formattedContent
      .replace(/\*(.*?)\*/gm, modifyStarsSpace)
      .replace(/_(.*?)_/gm, modifyUnderscoresSpace)
      .replace(/\*\*(.*?)\*\*/gm, modifyDoubleStarsSpace)
      .replace(/__(.*?)__/gm, modifyDoubleUnderscoresSpace)
  }
  const type = _.get(message, 'attachment.type')
  if (type === 'text') {
    const content = _.get(message, 'attachment.content')
    const regexedMessage = applyRegex(content)
    message = _.set(message, 'attachment.content', regexedMessage)
  }
  if (type === 'quickReplies') {
    const content = _.get(message, 'attachment.content.title')
    const regexedMessage = applyRegex(content)
    message = _.set(message, 'attachment.content.title', regexedMessage)
  }
  return message
}

_.mixin({
  sortByKeys: (obj, comparator) =>
     _(obj).toPairs()
    .sortBy(
      pair => comparator ? comparator(pair[1], pair[0]) : 0
    )
    .fromPairs(),
})
