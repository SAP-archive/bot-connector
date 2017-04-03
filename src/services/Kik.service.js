import request from 'superagent'

import ServiceTemplate from './Template.service'
import { BadRequestError, ForbiddenError } from '../utils/errors'

const agent = require('superagent-promise')(require('superagent'), Promise)

/**
 * Connector's Kik Service
 */
export default class KikService extends ServiceTemplate {

  /*
   * Subscribe webhook
   */
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
      channel.isErrored = true
    }
  }

  static async onChannelUpdate (channel) {
    await KikService.onChannelCreate(channel)
  }

  /**
   * Check if the message come from a valid webhook
   */
  static checkSecurity (req, res, channel) {
    if (`${config.base_url}/webhook/${channel._id}` !== channel.webhook || req.headers['x-kik-username'] !== channel.userName) {
      throw new ForbiddenError()
    }
    res.status(200).send()
  }

  /**
   * Check if any params is missing
   */
  static checkParamsValidity (channel) {
    const { userName, apiKey } = channel

    if (!apiKey) { throw new BadRequestError('Parameter apiKey is missing') }
    if (!userName) { throw new BadRequestError('Parameter userName is missing') }

    return true
  }

  /**
   * Extract information from the request before the pipeline
   */
  static extractOptions (req) {
    const { body } = req

    return {
      chatId: body.messages[0].chatId,
      senderId: body.messages[0].participants[0],
    }
  }

  /**
   * send 200 to kik to stop pipeline
   */
  static async beforePipeline (req, res, channel) {
    return channel
  }

  /**
   * Parse the message to the connector format
   */
  static parseChannelMessage (conversation, message, opts) {
    const firtsMessage = message.messages[0]
    const msg = {
      attachment: {},
      channelType: 'kik',
    }

    switch (firtsMessage.type) {
    case 'text':
      msg.attachment = { type: 'text', content: firtsMessage.body }
      break
    case 'link':
      msg.attachment = { type: 'link', content: firtsMessage.url }
      break
    case 'picture':
      msg.attachment = { type: 'picture', content: firtsMessage.picUrl }
      break
    case 'video':
      msg.attachment = { type: 'video', content: firtsMessage.videoUrl }
      break
    default:
      throw new BadRequestError('Format not supported')
    }
    return [conversation, msg, opts]
  }

  /**
   * Parse the message to the Connector format
   */
  static formatMessage (conversation, message, opts) {
    const reply = []
    let keyboards = null

    if (message.attachment.type === 'text') {
      reply.push({ type: message.attachment.type, chatId: opts.chatId, to: opts.senderId, body: message.attachment.content })

    } else if (message.attachment.type === 'picture') {
      reply.push({ type: message.attachment.type, chatId: opts.chatId, to: opts.senderId, picUrl: message.attachment.content })

    } else if (message.attachment.type === 'video') {
      reply.push({ type: message.attachment.type, chatId: opts.chatId, to: opts.senderId, videoUrl: message.attachment.content })

    } else if (message.attachment.type === 'quickReplies') {
      keyboards = [{ type: 'suggested' }]
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
      if (message.attachment.content.imageUrl) {
        reply.push({ type: 'picture', chatId: opts.chatId, to: opts.senderId, picUrl: message.attachment.content.imageUrl })
      }
      reply[reply.length - 1].keyboards = keyboards
    } else if (message.attachment.type === 'carouselle') {
      if (message.attachment.content && message.attachment.content.length) {
        keyboards = [{ type: 'suggested' }]
        keyboards[0].responses = message.attachment.content.map(c => ({ type: 'text', body: c.buttons[0].value }))
      }
      message.attachment.content.forEach(c => {

        if (c.title) {
          reply.push({ type: 'text', chatId: opts.chatId, to: opts.senderId, body: c.buttons[0].title })
        }
        if (c.imageUrl) {
          reply.push({ type: 'picture', chatId: opts.chatId, to: opts.senderId, picUrl: c.imageUrl })
        }
      })
      reply[reply.length - 1].keyboards = keyboards
    }

    return reply
  }

 /**
  * Send the message to kik
  */
  static async sendMessage (conversation, messages) {
    for (const message of messages) {
      await agent('POST', 'https://api.kik.com/v1/message')
        .auth(conversation.channel.userName, conversation.channel.apiKey)
        .send({ messages: [message] })
    }
  }
}
