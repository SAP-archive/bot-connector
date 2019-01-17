import _ from 'lodash'
import request from 'superagent'

import AbstractChannelIntegration from '../abstract_channel_integration'
import { logger } from '../../utils'
import { BadRequestError, UnauthorizedError } from '../../utils/errors'

export default class Slack extends AbstractChannelIntegration {

  populateMessageContext (req) {
    return {
      chatId: _.get(req, 'body.event.channel'),
      senderId: _.get(req, 'body.event.user'),
    }
  }

  validateChannelObject (channel) {
    if (!channel.token) {
      throw new BadRequestError('Parameter token is missing')
    }
  }

  parseIncomingMessage (conversation, message, opts) {
    const msg = { attachment: {} }
    const file = _.get(message, 'event.file', { mimetype: '' })

    opts.mentioned = _.get(message, 'event.channel', '').startsWith('D')
      || _.get(message, 'event.text', '').includes(`<@${conversation.channel.botuser}>`)

    if (file.mimetype.startsWith('image')) {
      _.set(msg, 'attachment', { type: 'picture', content: file.url_private })
    } else if (file.mimetype.startsWith('video')) {
      _.set(msg, 'attachment', { type: 'picture', content: file.url_private })
    } else if (message.event && message.event.text) {
      _.set(msg, 'attachment', {
        type: 'text',
        content: message.event.text.replace(`<@${conversation.channel.botuser}>`, ''),
      })
    } else {
      throw new BadRequestError('Message type non-supported by Slack')
    }

    return msg
  }

  formatOutgoingMessage (conversation, message) {
    const type = _.get(message, 'attachment.type')
    const content = _.get(message, 'attachment.content')
    const makeButton = ({ type, title, value }) => {
      const button = { name: title, text: title, type: 'button' }
      if (type === 'web_url') {
        button.url = value
      } else {
        button.value = value
      }
      return button
    }

    switch (type) {
    case 'text':
    case 'video': {
      return { text: content }
    }
    case 'picture': {
      return {
        attachments: [
          {
            fallback: content,
            image_url: content,
          },
        ],
      }
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
          actions: e.buttons.map(makeButton),
        })),
      }
    }
    case 'buttons':
    case 'quickReplies': {
      const { title, buttons } = content
      return {
        text: title,
        attachments: [{
          fallback: title,
          color: '#3AA3E3',
          attachment_type: 'default',
          callback_id: 'callback_id',
          actions: buttons.map(makeButton),
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
          actions: content.buttons.map(makeButton),
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
          actions: card.buttons.map(makeButton),
        })),
      }
    case 'custom':
      return content
    default:
      throw new BadRequestError('Message type non-supported by Slack')
    }
  }

  sendMessage (conversation, message) {
    return new Promise((resolve, reject) => {
      const req = request.post('https://slack.com/api/chat.postMessage')
        .query({ token: conversation.channel.token, channel: conversation.chatId, as_user: true })

      if (message.text) {
        req.query({ text: message.text })
      }

      if (message.attachments) {
        req.query({ attachments: JSON.stringify(message.attachments) })
      }

      req.end((err, res) => {
        if (err) {
          logger.error(`[Slack] Error sending message: ${err}`)
          reject(err)
        } else if (!res.body.ok) {
          // might come back with { ok: false, error: 'invalid_auth' }
          logger.error('[Slack] Error sending message: ', res.body)
          reject(new UnauthorizedError('Invalid authentication information for Slack'))
        } else {
          resolve('Message sent')
        }
      })
    })
  }

  populateParticipantData (participant, channel) {
    return new Promise((resolve, reject) => {
      const token = channel.token
      const senderId = participant.senderId

      request.get(`http://slack.com/api/users.info?token=${token}&user=${senderId}`)
        .end((err, res) => {
          if (err) {
            logger.error(`Error when retrieving Slack user info: ${err}`)
            return reject(err)
          }

          participant.data = res.body && res.body.user
          participant.markModified('data')

          participant.save().then(resolve).catch(reject)
        })
    })
  }

  parseParticipantDisplayName (participant) {
    return participant.data
      ? { userName: participant.data.real_name }
      : {}
  }

}
