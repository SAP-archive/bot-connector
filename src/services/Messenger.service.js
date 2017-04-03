import { getWebhookToken } from '../utils'
import { StopPipeline, BadRequestError } from '../utils/errors'
import ServiceTemplate from './Template.service'

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
  static checkSecurity (req, res) {
    res.status(200).send()
  }

  /**
   * Check to see if the message is form a valid webhook
   */
  static checkParamsValidity (channel) {
    const { token, apiKey } = channel

    if (!token) { throw new BadRequestError('Parameter token is missing') }
    if (!apiKey) { throw new BadRequestError('Parameter apiKey is missing') }

    return true
  }

  /**
   * Extract information from the request before the pipeline
   */
  static extractOptions (req) {
    const { body } = req
    return {
      chatId: `${body.entry[0].messaging[0].recipient.id}-${body.entry[0].messaging[0].sender.id}`,
      senderId: body.entry[0].messaging[0].sender.id,
    }
  }

  /**
   * Send directly a 200 to avoid the echo
   */
  static async beforePipeline (req, res, channel) {
    return channel
  }

  /**
   * Parse message to connector format
   */
  static async parseChannelMessage (conversation, message, opts) {
    const msg = {
      attachment: {},
      channelType: 'messenger',
    }

    if (message.entry[0].messaging[0].account_linking) {
      msg.attachment.type = 'account_linking'
      msg.attachment.status = message.entry[0].messaging[0].account_linking.status

      if (message.entry[0].messaging[0].account_linking.authorization_code) {
        msg.attachment.content = message.entry[0].messaging[0].account_linking.authorization_code
      }

      return Promise.all([conversation, msg, opts])
    }

    if (message.entry[0].messaging[0].postback) {
      msg.attachment.type = 'payload'
      msg.attachment.content = message.entry[0].messaging[0].postback.payload
      return Promise.all([conversation, msg, opts])
    }

    if (!message.entry[0].messaging[0].message || (message.entry[0].messaging[0].message.is_echo && message.entry[0].messaging[0].message.app_id)) {
      throw new StopPipeline()
    }

    const facebookMessage = message.entry[0].messaging[0].message
    const attachmentType = facebookMessage.attachments && facebookMessage.attachments[0].type

    if (attachmentType) {
      msg.attachment.type = attachmentType === 'image' ? 'picture' : attachmentType
      msg.attachment.content = facebookMessage.attachments[0].payload.url
    } else {
      msg.attachment.type = 'text'

      if (facebookMessage.quick_reply) {
        msg.attachment.content = facebookMessage.quick_reply.payload
        msg.attachment.is_button_click = true
      } else {
        msg.attachment.content = facebookMessage.text
      }
    }

    return Promise.all([conversation, msg, opts])
  }

  /*
   * Parse message from bot-connector format to bot-connecto format
   */
  static formatMessage (conversation, message, opts) {
    let msg = null

    if (message.attachment.type !== 'text' && message.attachment.type !== 'quickReplies') {
      let buttons = []
      msg = {
        recipient: { id: opts.senderId },
        message: {
          attachment: {
            type: String,
            payload: {},
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
          if (e.type === 'account_unlink') {
            buttons.push({ type: e.type })
          } else if (e.type === 'web_url' || e.type === 'account_link') {
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
      } else if (message.attachment.type === 'carouselle') {

        const elements = []
        msg.message.attachment.type = 'template'
        msg.message.attachment.payload.template_type = 'generic'
        message.attachment.content.forEach(content => {
          buttons = []
          content.buttons.forEach(e => {
            if (e.type === 'web_url' || e.type === 'account_link') {
              buttons.push({ type: e.type, title: e.title, url: e.value })
            } else if (e.type === 'postback' || e.type === 'phone_number' || e.type === 'element_share') {
              buttons.push({ type: e.type, title: e.title, payload: e.value })
            }
          })
          elements.push({
            subtitle: content.subtitle,
            title: content.title,
            item_url: content.itemUrl,
            image_url: content.imageUrl,
            buttons,
          })
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
      message.attachment.content.buttons.forEach(e => msg.message.quick_replies.push({ content_type: e.type ? e.type : 'text', title: e.title, payload: e.value }))
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
