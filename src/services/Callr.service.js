import _ from 'lodash'
import callr from 'callr'
import crypto from 'crypto'

import { Logger } from '../utils'
import Template from './Template.service'
import { BadRequestError, ForbiddenError } from '../utils/errors'

/*
 * checkParamsValidity: ok
 * onChannelCreate: ok
 * onChannelUpdate: ok
 * onChannelDelete: ok
 * onWebhookChecking: default
 * checkSecurity: ok
 * beforePipeline: default
 * extractOptions: ok
 * getRawMessage: default
 * sendIsTyping: default
 * updateConversationWithMessage: default
 * parseChannelMessage: ok
 * formatMessage: ok
 * sendMessage: ok
 */

export default class Callr extends Template {

  static checkParamsValidity (channel) {
    if (!channel.password) {
      throw new BadRequestError('Parameter password is missing')
    } else if (!channel.userName) {
      throw new BadRequestError('Parameter userName is missing')
    }
  }

  static async onChannelCreate (channel) {
    const type = 'sms.mo'
    const options = { hmac_secret: channel.password, hmac_algo: 'SHA256' }
    const api = new callr.api(channel.userName, channel.password)

    try {
      await new Promise((resolve, reject) => (api.call('webhooks.subscribe', type, channel.webhook, options)
        .success(async (res) => {
          channel.webhookToken = res.hash
          resolve()
        })
        .error(reject)))
      channel.isErrored = false
    } catch (err) {
      Logger.info('[CallR] Error while setting webhook')
      channel.isErrored = true
    }

    return channel.save()
  }

  static async onChannelUpdate (channel, oldChannel) {
    await Callr.onChannelDelete(oldChannel)
    await Callr.onChannelCreate(channel)
  }

  static async onChannelDelete (channel) {
    try {
      const api = new callr.api(channel.userName, channel.password)
      await new Promise((resolve, reject) => (api.call('webhooks.unsubscribe', channel.webhookToken)
        .success(resolve)
        .error(reject)))
    } catch (err) {
      Logger.info('[CallR] Error while unsetting webhook')
    }
  }

  static checkSecurity (req, res, channel) {
    const { password } = channel
    const payload = JSON.stringify(req.body)
    const webhookSig = req.headers['x-callr-hmacsignature']
    const hash = crypto.createHmac('SHA256', password).update(payload).digest('base64')

    if (hash !== webhookSig) {
      throw new ForbiddenError()
    }

    res.status(200).send()
  }

  static extractOptions (req) {
    return {
      chatId: _.get(req, 'body.data.from'),
      senderId: _.get(req, 'body.data.to'),
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

    return [conversation, msg, { ...opts, mentioned: true }]
  }

  static formatMessage (conversation, message) {
    const { type, content } = _.get(message, 'attachment', {})

    switch (type) {
    case 'text':
    case 'picture':
    case 'video':
      return content
    case 'quickReplies':
      const { title, buttons } = content
      return _.reduce(buttons, (acc, b) => `${acc}\n- ${b.title}`, `${title}\n`)
    case 'card': {
      const { title, subtitle, imageUrl, buttons } = content
      return _.reduce(buttons, (acc, b) => `${acc}\n- ${b.title}`, `${title}\n${subtitle}\n${imageUrl}\n`)
    }
    case 'list':
      return _.reduce(content.elements, (acc, elem) => {
        return `${acc}\n\n- ${elem.title}\n${elem.subtitle}\n${elem.imageUrl}`
      }, '')
    case 'carousel':
    case 'carouselle':
      return _.reduce(content, (acc, card) => {
        const { title, subtitle, imageUrl, buttons } = card
        return acc + _.reduce(buttons, (acc, b) => `${acc}\n- ${b.title}`, `${title}\n${subtitle}\n${imageUrl}\n`)
      }, '')
    default:
      throw new BadRequestError('Message type is non-supported by Callr')
    }
  }

  static sendMessage (conversation, message, opts) {
    return new Promise(async (resolve, reject) => {
      const { senderId } = opts
      const { chatId, channel } = conversation
      const api = new callr.api(channel.userName, channel.password)

      api.call('sms.send', senderId, chatId, message, null)
        .success(resolve)
        .error(reject)
    })
  }

}
