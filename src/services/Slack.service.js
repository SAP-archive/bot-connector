import { RtmClient, RTM_EVENTS } from '@slack/client'
import request from 'superagent'

import { ValidationError, ConnectorError } from '../utils/errors'
import MessagesController from '../controllers/Messages.controller'

import ServiceTemplate from './Template.service'
import Logger from '../utils/Logger'

export default class SlackService extends ServiceTemplate {
  // This static map will be used to stock all the socket connections to allow us to close connections when receiving PUT/DELETE on channels
  static allRtm = new Map()

  // This function launches all websocket clients for slack channels on startup
  static onLaunch () {
    return new Promise(resolve => {
      Channel
        .find({ type: 'slack' })
        .then(channels => {
          channels.forEach(c => SlackService.onChannelCreate(c))
          return resolve()
        })
        .catch(err => {
          Logger.error(`Error while handling slack socket: ${err}`)
          return resolve()
        })
    })
  }

  static checkParamsValidity (channel) {
    const { token } = channel

    if (!token) { throw new ValidationError('token', 'missing') }

    return true
  }

  /**
   * Create a socket connection to Slack
   */
  static onChannelCreate (channel) {
    if (channel.isActivated === false) {
      return
    }

    const rtm = new RtmClient(channel.token, { logLevel: 'info' })

    // Save rtm client in static map to close connection later
    SlackService.allRtm.set(channel._id.toString(), rtm)
    rtm.start()

    rtm.on(RTM_EVENTS.MESSAGE, slackMessage => {
      const opts = { chatId: slackMessage.channel, senderId: slackMessage.user }

      if (!slackMessage.user) { return }
      const user = rtm.dataStore.getUserById(slackMessage.user)
      if (!user) { return }
      const dm = rtm.dataStore.getDMByName(user.name)
      if (!dm) { return }

      // Start connector pipe for input message
      MessagesController.pipeMessage(channel._id, slackMessage, opts)
        .catch(err => {
          Logger.error(`An error occured while handling message: ${err}`)
          if (err instanceof ConnectorError) {
            rtm.sendMessage(err.message, slackMessage.channel)
          } else {
            rtm.sendMessage('An error occured while sending message', slackMessage.channel)
          }
        })
    })
  }

  /**
   *  Close and open a Slack socket connection
   */
  static async onChannelUpdate (channel) {
    SlackService.onChannelDelete(channel)
    await SlackService.onChannelCreate(channel)
  }

  /**
   * Delete the Slack socket connection
   */
  static onChannelDelete (channel) {
    const rtm = SlackService.allRtm.get(channel._id.toString())
    if (rtm) {
      rtm.disconnect()
      SlackService.allRtm.delete(channel._id.toString())
    }
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

      if (message.file) {
        if (message.file.mimetype.startsWith('image')) {
          attachment = { type: 'picture', content: message.file.url_private }
        } else if (message.file.mimetype.startsWith('video')) {
          attachment = { type: 'picture', content: message.file.url_private }
        } else {
          return reject(new ConnectorError('Sorry but we don\'t handle such type of file'))
        }
      } else {
        attachment = { type: 'text', content: message.text }
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
    // Handle quickreplies as buttons
    case 'quickReplies':
      slackFormattedMessage = {
        text: content.title,
      }
      slackFormattedMessage.attachments = [{
        fallback: 'Sorry but I can\'t display buttons',
        attachment_type: 'default',
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
      slackFormattedMessage = {
        text: content.title,
      }
      slackFormattedMessage.attachments = [{
        fallback: 'Sorry but I can\'t display buttons',
        attachment_type: 'default',
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
        .end(err => {
          if (err) {
            Logger.error('Error while sending message to slack')
            return reject(err)
          }
          resolve('Message sent')
        })
    })
  }
}
