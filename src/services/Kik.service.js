import request from 'superagent'

import ServiceTemplate from './Template.service'

const agent = require('superagent-promise')(require('superagent'), Promise)

export default class KikService extends ServiceTemplate {

  /**
   * Check if the message come from a valid webhook
   */
  static checkSecurity (req, channel) {
    return ('https://'.concat(req.headers.host) === channel.webhook && req.headers['x-kik-username'] === channel.userName)
  }

  /**
   * Check if any params is missing
   */
  static checkParamsValidity (channel) {
    const { userName, apiKey, webhook } = channel

    if (!apiKey) { throw new ValidationError('apiKey', 'missing') }
    if (!webhook) { throw new ValidationError('webhook', 'missing') }
    if (!userName) { throw new ValidationError('userName', 'missing') }

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
  static async beforePipeline (res) {
    return res.status(200).send()
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
      msg.attachment = { type: 'text', value: firtsMessage.body }
      break
    case 'link':
      msg.attachment = { type: 'link', value: firtsMessage.url }
      break
    case 'picture':
      msg.attachment = { type: 'picture', value: firtsMessage.picUrl }
      break
    case 'video':
      msg.attachment = { type: 'video', value: firtsMessage.videoUrl }
      break
    default:
      msg.attachment = { type: 'text', value: 'we don\'t handle this type' }
      break
    }
    message = msg
    return [conversation, message, opts]
  }

  /*
  * Parse the message to send it to kik
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
        keyboards = [{ type: 'suggested' }]
        keyboards[0].responses = message.attachment.content.buttons.map(button => ({ type: 'text', body: button.title }))
      }
      if (message.attachment.content.title) {
        reply.push({ type: 'text', chatId: opts.chatId, to: opts.senderId, body: message.attachment.content.title })
      }
      if (message.attachment.content.imageUrl) {
        reply.push({ type: 'picture', chatId: opts.chatId, to: opts.senderId, picUrl: message.attachment.content.imageUrl })
      }
      reply[reply.length - 1].keyboards = keyboards
    } else {
      reply.push({ type: 'text', chatId: opts.chatId, to: opts.senderId, body: 'wrong parameter' })
    }

    return reply
  }

  /*
  * Suscribe webhook
  */
  static onChannelCreate (channel) {
    const data = {
      webhook: `${channel.webhook}/webhook/${channel._id}`,
      features: {
        receiveReadReceipts: false,
        receiveIsTyping: false,
        manuallySendReadReceipts: false,
        receiveDeliveryReceipts: false,
      },
    }

    return new Promise((resolve, reject) => {
      request.post('https://api.kik.com/v1/config')
        .auth(channel.userName, channel.apiKey)
        .send(data)
        .end(err => {
          if (!err) { return resolve() }
          return reject({
            error: 'Error while subscribing bot to Kik server',
            status: 502,
          })
        })
    })
  }

 /**
  * send the message to kik
  */
  static async sendMessage (conversation, messages) {
    for (const message of messages) {
      await agent('POST', 'https://api.kik.com/v1/message')
        .auth(conversation.channel.userName, conversation.channel.apiKey)
        .send({ messages: [message] })
    }
  }
}
