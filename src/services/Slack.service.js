import _ from 'lodash'
import request from 'superagent'

import Logger from '../utils/Logger'
import Template from './Template.service'
import { BadRequestError } from '../utils/errors'

/*
 * checkParamsValidity: ok
 * onChannelCreate: default
 * onChannelUpdate: default
 * onChannelDelete: default
 * onWebhookChecking: default
 * checkSecurity: default
 * beforePipeline: default
 * extractOptions: ok
 * getRawMessage: default
 * sendIsTyping: default
 * updateConversationWithMessage: default
 * parseChannelMessage: default
 * formatMessage: ok
 * sendMessage: ok
 */

export default class Slack extends Template {

  static extractOptions (req) {
    return {
      chatId: _.get(req, 'body.event.channel'),
      senderId: _.get(req, 'body.event.user'),
    }
  }

  static checkParamsValidity (channel) {
    if (!channel.token) {
      throw new BadRequestError('Parameter token is missing')
    }
  }

  static parseChannelMessage (conversation, message, opts) {
    const msg = { attachment: {} }
    const file = _.get(message, 'event.file', { mimetype: '' })

    opts.mentioned = _.get(message, 'event.channel', '').startsWith('D')
      || _.get(message, 'event.text', '').includes(`<@${conversation.channel.botuser}>`)

    Logger.inspect(message)

    if (file.mimetype.startsWith('image')) {
      _.set(msg, 'attachment', { type: 'picture', content: file.url_private })
    } else if (file.mimetype.startsWith('video')) {
      _.set(msg, 'attachment', { type: 'picture', content: file.url_private })
    } else if (message.event && message.event.text) {
      _.set(msg, 'attachment', { type: 'text', content: message.event.text.replace(`<@${conversation.channel.botuser}>`, '') })
    } else {
      throw new BadRequestError('Message type non-supported by Slack')
    }

    return [conversation, msg, opts]
  }

  static formatMessage (conversation, message) {
    const type = _.get(message, 'attachment.type')
    const content = _.get(message, 'attachment.content')

    switch (type) {
    case 'text':
    case 'video':
    case 'picture': {
      return { text: content }
    }
    case 'list': {
      return {
        attachments: content.elements.map(e => ({
          color: '#3AA3E3',
          title: e.title,
          text: e.subtitle,
          image_url: e.imageUrl,
          attachment_type: 'default',
          callback_id: 'callback_id',
          actions: e.buttons.map(({ title, value }) => ({ name: title, text: title, type: 'button', value })),
        })),
      }
    }
    case 'quickReplies': {
      const { title, buttons } = content
      return {
        text: title,
        attachments: [{
          fallback: title,
          color: '#3AA3E3',
          attachemnt_type: 'default',
          callback_id: 'callback_id',
          actions: buttons.map(({ title, value }) => ({ name: title, text: title, type: 'button', value })),
        }],
      }
    }
    case 'card': {
      return {
        attachments: [{
          color: '#7CD197',
          title: content.title,
          text: content.subtitle,
          image_url: content.imageUrl,
          fallback: content.title,
          attachment_type: 'default',
          callback_id: 'callback_id',
          actions: content.buttons.map(({ title, value }) => ({ name: title, text: title, type: 'button', value })),
        }],
      }
    }
    case 'carousel':
    case 'carouselle':
      return {
        attachments: content.map(card => ({
          color: '#F35A00',
          title: card.title,
          image_url: card.imageUrl,
          attachment_type: 'default',
          callback_id: 'callback_id',
          actions: card.buttons.map(({ title, value }) => ({ name: title, text: title, type: 'button', value })),
        })),
      }
    default:
      throw new BadRequestError('Message type non-supported by Slack')
    }
  }

  static sendMessage (conversation, message) {
    return new Promise((resolve, reject) => {
      const req = request.post('https://slack.com/api/chat.postMessage')
        .query({ token: conversation.channel.token, channel: conversation.chatId, as_user: true })

      if (message.text) {
        req.query({ text: message.text })
      }

      if (message.attachments) {
        req.query({ attachments: JSON.stringify(message.attachments) })
      }

      req.end((err) => err ? reject(err) : resolve('Message sent'))
    })
  }

}
