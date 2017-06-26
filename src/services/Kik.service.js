import _ from 'lodash'
import request from 'superagent'

import { Logger, arrayfy } from '../utils'
import Template from './Template.service'
import { BadRequestError, ForbiddenError } from '../utils/errors'

const agent = require('superagent-promise')(require('superagent'), Promise)

/*
 * checkParamsValidity: ok
 * onChannelCreate: ok
 * onChannelUpdate: ok
 * onChannelDelete: default
 * onWebhookChecking: default
 * checkSecurity: ok
 * beforePipeline: default
 * extractOptions: ok
 * getRawMessage: default
 * sendIsTyping: ok
 * updateConversationWithMessage: default
 * parseChannelMessage: ok
 * formatMessage: ok
 * sendMessage: ok
 */

export default class Kik extends Template {

  static checkParamsValidity (channel) {
    if (!channel.apiKey) {
      throw new BadRequestError('Parameter apiKey is missing')
    } else if (!channel.userName) {
      throw new BadRequestError('Parameter userName is missing')
    }
  }

  static async onChannelCreate (channel) {
    const data = {
      webhook: channel.webhook,
      features: {
        receiveReadReceipts: false,
        receiveIsTyping: false,
        manuallySendReadReceipts: false,
        receiveDeliveryReceipts: false,
      },
    }

    try {
      await new Promise((resolve, reject) => {
        request.post('https://api.kik.com/v1/config')
          .auth(channel.userName, channel.apiKey)
          .send(data)
          .end((err) => err ? reject(err) : resolve())
      })
      channel.isErrored = false
    } catch (err) {
      Logger.info('[Kik] Cannot set the webhook')
      channel.isErrored = true
    }
  }

  static onChannelUpdate = Kik.onChannelCreate

  static checkSecurity (req, res, channel) {
    if (`https://${req.headers.host}/connect/v1/webhook/${channel._id}` !== channel.webhook || req.headers['x-kik-username'] !== channel.userName) {
      throw new ForbiddenError()
    }

    res.status(200).send()
  }

  static extractOptions (req) {
    return {
      chatId: _.get(req, 'body.messages[0].chatId'),
      senderId: _.get(req, 'body.messages[0].participants[0]'),
    }
  }

  static async sendIsTyping (channel, options) {
    const message = {
      to: options.senderId,
      chatId: options.chatId,
      type: 'is-typing',
      isTyping: true,
    }

    return agent('POST', 'https://api.kik.com/v1/message')
      .auth(channel.userName, channel.apiKey)
      .send({ messages: [message] })
  }

  static parseChannelMessage (conversation, message, opts) {
    message = _.get(message, 'messages[0]', {})
    const msg = { attachment: {}, channelType: 'kik' }

    switch (message.type) {
    case 'text':
      msg.attachment = { type: 'text', content: message.body }
      break
    case 'link':
      msg.attachment = { type: 'link', content: message.url }
      break
    case 'picture':
      msg.attachment = { type: 'picture', content: message.picUrl }
      break
    case 'video':
      msg.attachment = { type: 'video', content: message.videoUrl }
      break
    default:
      throw new BadRequestError('Message non-supported by Kik')
    }

    return [conversation, msg, { ...opts, mentioned: true }]
  }

  static formatMessage (conversation, message, opts) {
    const content = _.get(message, 'attachment.content')
    const type = _.get(message, 'attachment.type')
    const msg = { chatId: opts.chatId, to: opts.senderId, type }

    switch (type) {
    case 'text':
      return { ...msg, body: content }
    case 'picture':
      return { ...msg, picUrl: content }
    case 'video':
      return { ...msg, videoUrl: content }
    case 'list': {
      const replies = content.elements.map(elem => {
        return {
          ...msg,
          type: 'text',
          body: `\n${elem.title}\n${elem.subtitle}\n${elem.imageUrl}`,
        }
      })

      replies[replies.length - 1].keyboards = [{
        type: 'suggested',
        responses: content.buttons.map(b => ({ type: 'text', body: b.title })),
      }]
      return replies
    }
    case 'quickReplies': {
      return {
        ...msg,
        type: 'text',
        body: content.title,
        keyboards: [{
          type: 'suggested',
          responses: content.buttons.map(b => ({ type: 'text', body: b.title })),
        }],
      }
    }
    case 'card': {
      const replies = []
      const keyboard = { type: 'suggested' }
      keyboard.responses = content.buttons.map(b => ({ type: 'text', body: b.title }))
      replies.push({ ...msg, type: 'text', body: content.title })

      if (content.imageUrl) {
        replies.push({ ...msg, type: 'picture', picUrl: content.imageUrl })
      }

      replies[replies.length - 1].keyboards = [keyboard]
      return replies
    }
    case 'carousel':
    case 'carouselle': {
      const replies = []
      const keyboard = { type: 'suggested' }
      keyboard.responses = [].concat.apply([], content.map(c => c.buttons)).map(b => ({ type: 'text', body: b.title }))

      for (const card of content) {
        replies.push({ ...msg, type: 'text', body: card.title })

        if (card.imageUrl) {
          replies.push({ ...msg, type: 'picture', picUrl: card.imageUrl })
        }
      }

      replies[replies.length - 1].keyboards = [keyboard]
      return replies
    }
    default:
      throw new BadRequestError('Message type non-supported by Kik')
    }
  }

  static async sendMessage (conversation, messages) {
    for (const message of arrayfy(messages)) {
      await agent('POST', 'https://api.kik.com/v1/message')
        .auth(conversation.channel.userName, conversation.channel.apiKey)
        .send({ messages: [message] })
    }
  }

}
