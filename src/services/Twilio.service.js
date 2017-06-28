import _ from 'lodash'
import crypto from 'crypto'
import superagent from 'superagent'
import superagentPromise from 'superagent-promise'

import Template from './Template.service'
import { BadRequestError, ForbiddenError } from '../utils/errors'

const agent = superagentPromise(superagent, Promise)

/*
 * checkParamsValidity: ok
 * onChannelCreate: default
 * onChannelUpdate: default
 * onChannelDelete: default
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

export default class Twilio extends Template {

  static checkParamsValidity (channel) {
    channel.phoneNumber = channel.phoneNumber.split(' ').join('')

    if (!channel.clientId) {
      throw new BadRequestError('Parameter is missing: Client Id')
    } else if (!channel.clientSecret) {
      throw new BadRequestError('Parameter is missing: Client Secret')
    } else if (!channel.serviceId) {
      throw new BadRequestError('Parameter is missing: Service Id')
    } else if (!channel.phoneNumber) {
      throw new BadRequestError('Parameter is missing: Phone Number')
    }
  }

  static checkSecurity (req, res, channel) {
    const signature = req.headers['x-twilio-signature']
    const webhook = channel.webhook
    let str = webhook
    _.forOwn(_.sortBy(Object.keys(req.body)), (value) => {
      str += value
      str += req.body[value]
    })
    const hmac = crypto.createHmac('SHA1', channel.clientSecret).update(str).digest('base64')
    if (signature !== hmac) {
      throw new ForbiddenError()
    }
  }

  static extractOptions (req) {
    const { body } = req

    return {
      chatId: `${body.To}${body.From}`,
      senderId: body.From,
    }
  }

  static parseChannelMessage (conversation, message, opts) {
    const msg = {
      attachment: {
        type: 'text',
        content: message.Body,
      },
    }

    return [conversation, msg, { ...opts, mentioned: true }]
  }

  static formatMessage (conversation, message, opts) {
    const { chatId } = conversation
    const { type, content } = message.attachment
    const to = opts.senderId
    let body = ''

    switch (type) {
    case 'text':
    case 'picture':
    case 'video': {
      body = content
      break
    }
    case 'list': {
      return _.reduce(content.elements, (acc, elem) => {
        return `${acc}\r\n${elem.title}\r\n${elem.subtitle}\r\n${elem.imageUrl}`
      }, '')
    }
    case 'quickReplies': {
      const { title, buttons } = content
      body = `${title}\r\n`.concat(buttons.map(b => b.title).join('\r\n'))
      break
    }
    case 'card': {
      const { title, subtitle, imageUrl, buttons } = content
      body = _.reduce(buttons, (acc, b) => `${acc}\r\n- ${b.title}`, `${title}\r\n${subtitle}\r\n${imageUrl}`)
      break
    }
    case 'carouselle':
    case 'carousel': {
      body = _.reduce(content, (acc, card) => {
        const { title, subtitle, imageUrl, buttons } = card
        return acc + _.reduce(buttons, (acc, b) => `${acc}\n- ${b.title}`, `${title}\n${subtitle}\n${imageUrl}\n`)
      }, '')
      break
    }
    default:
      throw new BadRequestError('Message type non-supported by Twilio')
    }

    return { chatId, to, body, type }
  }

  static async sendMessage (conversation, message) {
    const data = {
      To: message.to,
      Body: message.body,
      From: conversation.channel.phoneNumber,
      MessagingServiceSid: conversation.channel.serviceId,
    }

    await agent('POST', `https://api.twilio.com/2010-04-01/Accounts/${conversation.channel.clientId}/Messages.json`)
      .auth(conversation.channel.clientId, conversation.channel.clientSecret)
      .type('form')
      .send(data)
  }

}
