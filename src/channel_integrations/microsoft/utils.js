// @flow

import { ChatConnector, UniversalBot, MemoryBotStorage } from 'botbuilder'
import fileType from 'file-type'
import http from 'http'
import https from 'https'

export function microsoftParseMessage (channel, req) {
  return new Promise((resolve, reject) => {
    const connector = new ChatConnector({
      appId: channel.clientId,
      appPassword: channel.clientSecret,
    })
    const res = {
      rejectIfInvalidStatus () {
        if (!this.rejected && this.stat !== undefined && (this.stat < 200 || this.stat >= 300)) {
          this.rejected = true
          reject(new Error('error while receiving message, status : '.concat(this.stat)))
        }
      },
      status (status) {
        this.rejectIfInvalidStatus()
        this.stat = status
        this.rejectIfInvalidStatus()
      },
      send (status) {
        this.rejectIfInvalidStatus()
        this.stat = status
        this.rejectIfInvalidStatus()
      },
      end () {
        this.rejectIfInvalidStatus()
      },
    }
    connector.listen()(req, res)
    const bot = new UniversalBot(connector, (session) => {
      resolve({ session, message: session.message })
    })
    .set('storage', new MemoryBotStorage())
    bot.linterPleaseLeaveMeAlone = 1
  })
}

export function microsoftGetBot (channel) {
  const connector = new ChatConnector({
    appId: channel.clientId,
    appPassword: channel.clientSecret,
  })
  const bot = new UniversalBot(connector).set('storage', new MemoryBotStorage())
  return bot
}

export function getFileType (url) {
  return new Promise((resolve, reject) => {
    let module = http
    if (url.startsWith('https')) {
      module = https
    }
    module.get(url, res => {
      res.once('data', chunk => {
        res.destroy()
        resolve(fileType(chunk))
      })
      res.once('error', () => { reject(new Error('could not get file type')) })
    })
  })
}

export async function microsoftMakeAttachement (url) {
  const { mime } = await getFileType(url)
  const name = url.split('/').reverse().filter(e => e.length > 0)[0]
  return {
    contentUrl: url,
    contentType: mime,
    name,
  }
}
