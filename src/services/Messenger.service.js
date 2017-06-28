import _ from 'lodash'
import request from 'superagent'

import Template from './Template.service'
import { getWebhookToken } from '../utils'
import { StopPipeline, BadRequestError, ForbiddenError } from '../utils/errors'

const agent = require('superagent-promise')(require('superagent'), Promise)

/*
 * checkParamsValidity: ok
 * onChannelCreate: default
 * onChannelUpdate: default
 * onChannelDelete: default
 * onWebhookChecking: ok
 * checkSecurity: default
 * beforePipeline: default
 * extractOptions: ok
 * getRawMessage: default
 * sendIsTyping: ok
 * updateConversationWithMessage: default
 * parseChannelMessage: ok
 * formatMessage: ok
 * sendMessage: ok
 */

export default class Messenger extends Template {

  static checkParamsValidity (channel) {
    if (!channel.token) {
      throw new BadRequestError('Parameter token is missing')
    } else if (!channel.apiKey) {
      throw new BadRequestError('Parameter apiKey is missing')
    }
  }

  static onWebhookChecking (req, res, channel) {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === getWebhookToken(channel._id, channel.slug)) {
      res.status(200).send(req.query['hub.challenge'])
    } else {
      throw new BadRequestError('Error while checking the webhook validity')
    }
  }

  static async checkSecurity (req, res, channel) {
    if (channel.webhook.startsWith('https://'.concat(req.headers.host))) {
      res.status(200).send()
    } else {
      throw new ForbiddenError()
    }
  }

  static extractOptions (req) {
    const recipientId = _.get(req, 'body.entry[0].messaging[0].recipient.id')
    const senderId = _.get(req, 'body.entry[0].messaging[0].sender.id')

    return {
      chatId: `${recipientId}-${senderId}`,
      senderId,
    }
  }

  static sendIsTyping (channel, options, message) {
    message = _.get(message, 'entry[0].messaging[0]', {})

    if (!message.message || (message.is_echo && message.app_id)) {
      return
    }

    return agent('POST', `https://graph.facebook.com/v2.6/me/messages?access_token=${channel.token}`)
      .send({
        recipient: { id: options.senderId },
        sender_action: 'typing_on',
      })
  }

  static async parseChannelMessage (conversation, message, opts) {
    const msg = {}
    message = _.get(message, 'entry[0].messaging[0]')
    const type = _.get(message, 'message.attachments[0].type')
    const quickReply = _.get(message, 'message.quick_reply.payload')

    if (message.account_linking) {
      const { status, authorization_code } = _.get(message, 'account_linking')
      msg.attachment = { type: 'account_linking', status, content: authorization_code }
    } else if (message.postback) {
      const content = _.get(message, 'postback.payload')
      msg.attachment = { type: 'payload', content }
    } else if (!message.message || (message.message.is_echo && message.message.app_id)) {
      throw new StopPipeline()
    } else if (type) {
      const content = _.get(message, 'message.attachments[0].payload.url')
      msg.attachment = {
        type: type === 'image' ? 'picture' : type,
        content,
      }
    } else if (quickReply) {
      msg.attachment = { type: 'text', content: quickReply, is_button_click: true }
    } else {
      const content = _.get(message, 'message.text')
      msg.attachment = { type: 'text', content }
    }

    if (message.message && message.message.is_echo && !message.message.app_id) {
      _.set(msg, 'attachment.isEcho', true)
    }

    return Promise.all([conversation, msg, { ...opts, mentioned: true }])
  }

  static formatMessage (conversation, message, opts) {
    const { type, content } = _.get(message, 'attachment')
    const msg = {
      recipient: { id: opts.senderId },
      message: {},
    }

    switch (type) {
    case 'text':
      _.set(msg, 'message', { text: content })
      break
    case 'video':
    case 'picture':
    case 'audio': // Special case needed for StarWars ?
      _.set(msg, 'message.attachment.type', type === 'picture' ? 'image' : type)
      _.set(msg, 'message.attachment.payload.url', content)
      break
    case 'card':
      const { title, itemUrl: item_url, imageUrl: image_url, subtitle } = _.get(message, 'attachment.content', {})
      const buttons = _.get(message, 'attachment.content.buttons', [])
        .map(({ type, title, value }) => {
          if (['web_url', 'account_linking'].indexOf(type) !== -1) {
            return { type, title, url: value }
          } else if (['postback', 'phone_number', 'element_share'].indexOf(type) !== -1) {
            return { type, title, payload: value }
          }
          return { type }
        })

      _.set(msg, 'message.attachment.type', 'template')
      _.set(msg, 'message.attachment.payload.template_type', 'generic')
      _.set(msg, 'message.attachment.payload.elements', [{ title, item_url, image_url, subtitle, buttons }])
      break
    case 'quickReplies':
      const text = _.get(message, 'attachment.content.title', '')
      const quick_replies = _.get(message, 'attachment.content.buttons', [])
        .map(b => ({ content_type: b.type || 'text', title: b.title, payload: b.value }))

      _.set(msg, 'message', { text, quick_replies })
      break
    case 'list': {
      const elements = _.get(message, 'attachment.content.elements', [])
        .map(e => ({
          title: e.title,
          image_url: e.imageUrl,
          subtitle: e.subtitle,
          buttons: e.buttons && e.buttons.map(b => ({ title: b.title, type: b.type, payload: b.value })),
        }))
      const buttons = _.get(message, 'attachment.content.buttons', [])
        .map(b => ({ title: b.title, type: b.type, payload: b.value }))

      _.set(msg, 'message.attachment.type', 'template')
      _.set(msg, 'message.attachment.payload', { template_type: 'list', elements })

      if (buttons.length > 0) {
        _.set(msg, 'message.attachment.payload.buttons', buttons)
      }
      break
    }
    case 'carousel':
    case 'carouselle':
      const elements = _.get(message, 'attachment.content', [])
          .map(content => {
            const { title, itemUrl: item_url, imageUrl: image_url, subtitle } = content
            const buttons = _.get(content, 'buttons', [])
              .map(({ type, title, value }) => {
                if (['web_url', 'account_link'].indexOf(type) !== -1) {
                  return { type, title, url: value }
                }
                return { type, title, payload: value }
              })
            const element = { title, subtitle, item_url, image_url }

            if (buttons.length > 0) {
              _.set(element, 'buttons', buttons)
            }

            return element
          })

      _.set(msg, 'message.attachment.type', 'template')
      _.set(msg, 'message.attachment.payload.template_type', 'generic')
      _.set(msg, 'message.attachment.payload.elements', elements)
      break
    default:
      throw new BadRequestError('Message type non-supported by Messenger')
    }

    return msg
  }

  static async sendMessage (conversation, message) {
    await agent('POST', `https://graph.facebook.com/v2.6/me/messages?access_token=${conversation.channel.token}`)
      .send(message)
  }

}

