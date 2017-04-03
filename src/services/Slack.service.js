import request from 'superagent'

import ServiceTemplate from './Template.service'
import Logger from '../utils/Logger'
import { BadRequestError, ConnectorError } from '../utils/errors'

export default class SlackService extends ServiceTemplate {

  static extractOptions (req) {
    const { body } = req

    return {
      chatId: body.event.channel,
      senderId: body.event.user,
    }
  }

  static checkSecurity (req, res) {
    res.status(200).send()
  }

  static checkParamsValidity (channel) {
    const { token } = channel

    if (!token) { throw new BadRequestError('Parameter token is missing') }

    return true
  }

  /**
   * Parse the message received by Slack to connector format
   */
  static parseChannelMessage (conversation, message, opts) {
    return new Promise((resolve, reject) => {
      const parsedMessage = {
        channelType: 'slack',
      }
      let attachment = {}
      if (message.event.file) {
        if (message.event.file.mimetype.startsWith('image')) {
          attachment = { type: 'picture', content: message.event.file.url_private }
        } else if (message.event.file.mimetype.startsWith('video')) {
          attachment = { type: 'picture', content: message.event.file.url_private }
        } else {
          return reject(new ConnectorError('Sorry but we don\'t handle such type of file'))
        }
      } else {
        attachment = { type: 'text', content: message.event.text }
      }
      parsedMessage.attachment = attachment
      return resolve([conversation, parsedMessage, opts])
    })
  }

    // Transforms a message from connector universal format to slack format
  static formatMessage (conversation, message) {
    const { type, content } = message.attachment
    let slackFormattedMessage = null
    switch (type) {
    case 'text':
      slackFormattedMessage = { text: content }
      break
    case 'video':
      slackFormattedMessage = { text: content }
      break
    case 'picture':
      slackFormattedMessage = { text: content }
      break
    case 'quickReplies':
      slackFormattedMessage = {
        text: content.title,
      }
      slackFormattedMessage.attachments = [{
        fallback: 'Sorry but I can\'t display buttons',
        attachment_type: 'default',
        callback_id: 'callback_id',
        actions: content.buttons.map(button => {
          button.name = button.title
          button.text = button.title
          button.type = 'button'
          delete button.title
          return button
        }),
      }]
      break
    case 'card':
      slackFormattedMessage = {}
      slackFormattedMessage.attachments = [{
        title: content.title,
        text: content.subtitle,
        image_url: content.imageUrl,
        fallback: 'Sorry but I can\'t display buttons',
        attachment_type: 'default',
        callback_id: 'callback_id',
        actions: content.buttons.map(button => {
          button.name = button.title
          button.text = button.title
          button.type = 'button'
          delete button.title
          return button
        }),
      }]
      break
    default:
      throw new Error('Invalid message type')
    }
    return slackFormattedMessage
  }

  /**
   * Send a message to the Bot
   */
  static sendMessage (conversation, message) {
    return new Promise((resolve, reject) => {
      const authParams = `token=${conversation.channel.token}&channel=${conversation.chatId}&as_user=true`
      let params = ''
      if (message.text) {
        params = `&text=${message.text}`
      }
      if (message.attachments) {
        params = `${params}&attachments=${JSON.stringify(message.attachments)}`
      }
      request.post(`https://slack.com/api/chat.postMessage?${authParams}${params}`)
      .end((err) => {
        if (err) {
          Logger.error('Error while sending message to slack')
          return reject(err)
        }
        resolve('Message sent')
      })
    })
  }
}
