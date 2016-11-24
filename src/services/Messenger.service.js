import crypto from 'crypto'
import tsscmp from 'tsscmp'
import ServiceTemplate from './Template.service'
import { StopPipeline, ValidationError } from '../utils/errors'
import { getWebhookToken } from '../utils'

const agent = require('superagent-promise')(require('superagent'), Promise)

export default class MessengerService extends ServiceTemplate {

  /**
   * Suscribe webhook
   */
  static connectWebhook (req, channel) {
    return (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === getWebhookToken(channel._id, channel.slug))
  }

  /**
   * Check to see if the message is form a valid webhook
   */
  static checkSecurity (req, channel) {
    const xHubSignature = req.headers['X-Hub-Signature'] || req.headers['x-hub-signature']
    const parsedXHubSignature = xHubSignature.split('=')
    const serverSignature = crypto.createHmac(parsedXHubSignature[0], channel.apiKey).update(JSON.stringify(req.body)).digest('hex')
    return ('https://'.concat(req.headers.host) === channel.webhook && tsscmp(parsedXHubSignature[1], serverSignature))
  }

  /**
   * Check to see if the message is form a valid webhook
   */
  static checkParamsValidity (channel) {
    const { token, webhook, apiKey } = channel
    if (!token) { throw new ValidationError('token', 'missing') }
    if (!webhook) { throw new ValidationError('webhook', 'missing') }
    if (!apiKey) { throw new ValidationError('apiKey', 'missing') }

    return true
  }

  /**
   * Extract information from the request before the pipeline
   */
  static extractOptions (req) {
    const { body } = req
    return {
      chatId: body.entry[0].messaging[0].recipient.id,
      senderId: body.entry[0].messaging[0].sender.id,
    }
  }

  /**
   * Send directly a 200 to avoid the echo
   */
  static async beforePipeline (res) {
    return res.status(200).send()
  }

  /**
   * Parse message to connector format
   */
  static async parseChannelMessage (conversation, message, opts) {
    const msg = {
      attachment: {},
      channelType: 'messenger',
    }
    if (message.entry[0].messaging[0].postback) {
      msg.attachment.text = 'start_conversation'
      return Promise.all([conversation, msg, opts])
    }

    if (!message.entry[0].messaging[0].message || (message.entry[0].messaging[0].message.is_echo && message.entry[0].messaging[0].message.app_id)) { throw new StopPipeline() }

    const facebookMessage = message.entry[0].messaging[0].message

    if (facebookMessage.attachment) {
      msg.attachment.type = facebookMessage.attachment[0].type
      msg.attachment.content = facebookMessage.attachment[0].payload.url
    } else { msg.attachment.text = facebookMessage.text }

    return Promise.all([conversation, msg, opts])
  }

  /*
   * Parse message from bot-connector format to bot-connecto format
   */
  static formatMessage (conversation, message, opts) {
    let msg

    if (message.attachment.type !== 'text' && message.attachment.type !== 'quickReplies') {
      const buttons = []
      msg = {
        recipient: { id: opts.senderId },
        message: {
          attachment: {
            type: String,
            payload: { },
          },
        },
      }

      if (message.attachment.type === 'picture') {
        msg.message.attachment.type = 'image'
        msg.message.attachment.payload.url = message.attachment.content
      } else if (message.attachment.type === 'video' || message.attachment.type === 'audio') {
        msg.message.attachment.type = message.attachment.type
        msg.message.attachment.payload.url = message.attachment.content
      } else if (message.attachment.type === 'card') {
        const elements = []
        msg.message.attachment.type = 'template'
        msg.message.attachment.payload.template_type = 'generic'
        message.attachment.content.buttons.forEach(e => {
          if (e.type === 'web_url' || e.type === 'account_link') {
            buttons.push({ type: e.type, title: e.title, url: e.value })
          } else if (e.type === 'postback' || e.type === 'phone_number' || e.type === 'element_share') {
            buttons.push({ type: e.type, title: e.title, payload: e.value })
          }
        })
        elements.push({
          title: message.attachment.content.title,
          item_url: message.attachment.content.itemUrl,
          image_url: message.attachment.content.imageUrl,
          subtitle: message.attachment.content.subtitle,
          buttons,
        })
        msg.message.attachment.payload.elements = elements
      }

    } else if (message.attachment.type === 'quickReplies') {
      msg = {
        recipient: { id: opts.senderId },
        message: {
          text: message.attachment.content.title,
          quick_replies: [],
        },
      }
      message.attachment.content.buttons.forEach(e => msg.message.quick_replies.push({ content_type: e.type, title: e.title, payload: e.value }))
    } else {
      msg = {
        recipient: { id: opts.senderId },
        message: {
          text: message.attachment.content,
        },
      }
    }
    return msg
  }

  /*
   * Send message back to facebook
   */
  static async sendMessage (conversation, message) {
    await agent('POST', `https://graph.facebook.com/v2.6/me/messages?access_token=${conversation.channel.token}`)
          .send(message)
  }

}
