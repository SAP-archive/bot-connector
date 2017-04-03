import callr from 'callr'
import crypto from 'crypto'

import ServiceTemplate from './Template.service'
import { BadRequestError, ForbiddenError } from '../utils/errors'

export default class CallrService extends ServiceTemplate {

  static async onChannelCreate (channel) {
    const type = 'sms.mo'
    const options = { hmac_secret: channel.password, hmac_algo: 'SHA256' }
    const api = new callr.api(channel.userName, channel.password)

    try {
      await new Promise((resolve, reject) => (api.call('webhooks.subscribe', type, channel.webhook, options)
        .success(async (res) => {
          channel.webhookToken = res.hash
          await channel.save()
          resolve(res)
        })
        .error(reject)))
    } catch (err) {
      channel.isErrored = true
    }
  }

  static async onChannelUpdate (channel, oldChannel) {
    const type = 'sms.mo'
    const client = new callr.api(channel.userName, channel.password)
    const channelOptions = { hmac_secret: channel.password }
    const oldClient = new callr.api(oldChannel.userName, oldChannel.password)

    try {
      await new Promise((resolve) => oldClient.call('webhooks.unsubscribe', oldChannel.webhookToken).success(resolve()).error(resolve()))
      await new Promise((resolve, reject) => client.call('webhooks.subscribe', type, channel.webhook, channelOptions)
        .success(async (res) => {
          channel.webhookToken = res.hash
          await channel.save()
          resolve(res)
        })
        .error(reject))
      channel.isErrored = false
    } catch (err) {
      channel.isErrored = true
    }
  }

  static onChannelDelete (channel) {
    const api = new callr.api(channel.userName, channel.password)

    api.call('webhooks.unsubscribe', channel.webhookToken)
  }

  static checkParamsValidity (channel) {
    const { userName, password } = channel

    if (!password) { throw new BadRequestError('Parameter password is missing') }
    if (!userName) { throw new BadRequestError('Parameter userName is missing') }

    return true
  }

  static async beforePipeline (req, res, channel) {
    return channel
  }

  static checkSecurity (req, res, channel) {
    const { password } = channel
    const payload = JSON.stringify(req.body)
    const webhookSig = req.headers['x-callr-hmacsignature']
    const hash = crypto.createHmac('SHA256', password).update(payload).digest('base64')

    if (hash !== webhookSig) { throw new ForbiddenError() }
    res.status(200).send()
  }

  static extractOptions (req) {
    const { body } = req

    return {
      chatId: body.data.to,
      senderId: body.data.from,
    }
  }

  static parseChannelMessage (conversation, message, opts) {
    const msg = {
      attachment: {
        type: 'text',
        content: message.data.text,
      },
      channelType: 'callr',
    }
    return [conversation, msg, opts]
  }

  static formatMessage (conversation, message, opts) {
    const reply = []
    let keyboards = null

    if (message.attachment.type === 'text' || message.attachment.type === 'picture' || message.attachment.type === 'video') {
      reply.push({ type: message.attachment.type, chatId: opts.chatId, to: opts.senderId, body: message.attachment.content })
    } else if (message.attachment.type === 'quickReplies') {
      const keyboards = [{ type: 'suggested' }]
      keyboards[0].responses = message.attachment.content.buttons.map(button => ({ type: 'text', body: button.title }))
      reply.push({ type: 'text', chatId: opts.chatId, to: opts.senderId, body: message.attachment.content.title, keyboards })
    } else if (message.attachment.type === 'card') {
      if (message.attachment.content.buttons && message.attachment.content.buttons.length) {
        keyboards = [{ type: 'suggested', responses: [] }]
        message.attachment.content.buttons.forEach(button => {
          if (button.type !== 'element_share') { keyboards[0].responses.push({ type: 'text', body: button.value }) }
        })
      }
      if (message.attachment.content.title) {
        reply.push({ type: 'text', chatId: opts.chatId, to: opts.senderId, body: message.attachment.content.title })
      }
      if (message.attachment.content.subtitle) {
        reply.push({ type: 'text', chatId: opts.chatId, to: opts.senderId, body: message.attachment.content.subtitle })
      }
      reply[reply.length - 1].keyboards = keyboards
    } else {
      throw new BadRequestError('Message type unsupported by CallR')
    }
    return reply
  }

  static sendMessage (conversation, messages, opts) {
    return new Promise(async (resolve, reject) => {
      const { senderId } = opts
      const { chatId, channel } = conversation
      const api = new callr.api(channel.userName, channel.password)

      const reply = messages.reduce((str, message) => {
        if (message.body && message.body.length) {
          str = `${str}${message.body}${'\n'}`
        }

        if (message.keyboards && message.keyboards) {
          const buttons = message.keyboards[0].responses
          buttons.forEach((button, i) => str = `${str}${i}${' - '}${button.body}${'\n'}`)
        }

        return str
      }, '')

      api.call('sms.send', chatId, senderId, reply, null)
        .success(resolve)
        .error(reject)
    })
  }

}
