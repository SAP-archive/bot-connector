import _ from 'lodash'
import request from 'superagent'

import { logger, arrayfy } from '../../utils'
import AbstractChannelIntegration from '../abstract_channel_integration'
import { BadRequestError, ForbiddenError } from '../../utils/errors'

const agent = require('superagent-promise')(request, Promise)

export default class Kik extends AbstractChannelIntegration {

  validateChannelObject (channel) {
    if (!channel.apiKey) {
      throw new BadRequestError('Parameter apiKey is missing')
    } else if (!channel.userName) {
      throw new BadRequestError('Parameter userName is missing')
    }
  }

  async beforeChannelCreated (channel) {
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
      await agent.post('https://api.kik.com/v1/config')
        .auth(channel.userName, channel.apiKey)
        .send(data)
      channel.isErrored = false
    } catch (err) {
      channel.isErrored = true
      throw new BadRequestError('Invalid user name or API key')
    }
  }

  afterChannelUpdated (channel) {
    return this.beforeChannelCreated(channel)
  }

  authenticateWebhookRequest (req, res, channel) {
    if (req.headers['x-kik-username'] !== channel.userName) {
      throw new ForbiddenError()
    }
  }

  populateMessageContext (req) {
    return {
      chatId: _.get(req, 'body.messages[0].chatId'),
      senderId: _.get(req, 'body.messages[0].participants[0]'),
    }
  }

  async onIsTyping (channel, context) {
    const message = {
      to: context.senderId,
      chatId: context.chatId,
      type: 'is-typing',
      isTyping: true,
    }

    return agent('POST', 'https://api.kik.com/v1/message')
      .auth(channel.userName, channel.apiKey)
      .send({ messages: [message] })
  }

  parseIncomingMessage (conversation, message) {
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

    return msg
  }

  static formatButtons (buttons = []) {
    return {
      type: 'suggested',
      responses: buttons.map(b => ({ type: 'text', body: b.title })),
    }
  }

  formatOutgoingMessage (conversation, message, opts) {
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

      const keyboard = Kik.formatButtons([].concat(...content.elements.map(elem => elem.buttons)))
      replies[replies.length - 1].keyboards = [keyboard]
      return replies
    }
    case 'buttons':
    case 'quickReplies': {
      const keyboard = Kik.formatButtons(content.buttons)
      return {
        ...msg,
        type: 'text',
        body: content.title,
        keyboards: [keyboard],
      }
    }
    case 'card': {
      const replies = []
      replies.push({ ...msg, type: 'text', body: content.title })

      if (content.imageUrl) {
        replies.push({ ...msg, type: 'picture', picUrl: content.imageUrl })
      }

      const keyboard = Kik.formatButtons(content.buttons)
      replies[replies.length - 1].keyboards = [keyboard]
      return replies
    }
    case 'carousel':
    case 'carouselle': {
      const replies = []

      for (const card of content) {
        replies.push({ ...msg, type: 'text', body: card.title })

        if (card.imageUrl) {
          replies.push({ ...msg, type: 'picture', picUrl: card.imageUrl })
        }
      }

      const buttons = [].concat.apply([], content.map(c => c.buttons))
      const keyboard = Kik.formatButtons(buttons)
      replies[replies.length - 1].keyboards = [keyboard]
      return replies
    }
    case 'custom': {
      return _.map(content, ({ type, ...replyProps }) => ({ ...replyProps, ...msg, type }))
    }
    default:
      throw new BadRequestError('Message type non-supported by Kik')
    }
  }

  async sendMessage (conversation, messages) {
    for (const message of arrayfy(messages)) {
      await agent('POST', 'https://api.kik.com/v1/message')
        .auth(conversation.channel.userName, conversation.channel.apiKey)
        .send({ messages: [message] })
    }
  }

  populateParticipantData (participant, channel) {
    return new Promise(async (resolve, reject) => {
      request.get(`https://api.kik.com/v1/user/${participant.senderId}`)
        .auth(channel.userName, channel.apiKey)
        .end((err, result) => {
          if (err) {
            logger.error(`[Kik] Error when retrieving user info: ${err}`)
            return reject(err)
          }

          participant.data = result.body
          participant.markModified('data')

          participant.save().then(resolve).catch(reject)
        })
    })
  }

  parseParticipantDisplayName (participant) {
    const informations = {}

    if (participant.data) {
      const { firstName, lastName } = participant.data
      informations.userName = `${firstName} ${lastName}`
    }

    return informations
  }
}
