import _ from 'lodash'
import { createHmac } from 'crypto'

import AbstractChannelIntegration from '../abstract_channel_integration'
import {
  lineSendMessage,
  lineGetUserProfile,
  BadRequestError,
  ForbiddenError,
  StopPipeline,
} from '../../utils'

const labelCharacterLimit = 20
const carouselLabelCharacteLimit = 12

export default class Line extends AbstractChannelIntegration {

  validateChannelObject (channel) {
    if (!channel.token || !channel.clientSecret) {
      throw new BadRequestError('Parameter token or clientSecret is missing')
    }
  }

  authenticateWebhookRequest (req, res, channel) {
    const signature = _.get(req, ['headers', 'x-line-signature'])
    const rawBody = _.get(req, 'rawBody')
    const channelSecret = _.get(channel, 'clientSecret')

    const computedSignature = createHmac('SHA256', channelSecret)
    .update(rawBody)
    .digest('base64')

    if (signature !== computedSignature) {
      throw new ForbiddenError()
    }
  }

  onWebhookCalled (req, res, channel) {
    if (_.get(req, 'body.events[0].replyToken') === '00000000000000000000000000000000') {
      // webhook verification request, reply with success, don't send a message
      throw new StopPipeline()
    }

    return channel
  }

  populateMessageContext (req) {
    const sourceType = _.get(req, 'body.events[0].source.type')
    const recipientId
      = sourceType === 'user' ? '' : _.get(req, `body.events[0].source.${sourceType}Id`)
    const senderId = _.get(req, 'body.events[0].source.userId', recipientId)

    return {
      chatId: `${recipientId}-${senderId}`,
      senderId,
    }
  }

  updateConversationContextFromMessage (conversation, message) {
    const eventType = _.get(message, 'events[0].type')
    if (eventType !== 'message' && eventType !== 'postback') {
      throw new StopPipeline()
    }

    const replyToken = _.get(message, 'events[0].replyToken')
    conversation.replyToken = replyToken
    conversation.markModified('replyToken')

    return conversation
  }

  parseIncomingMessage (conversation, message) {
    const msg = {}
    const eventType = _.get(message, 'events[0].type')

    if (eventType === 'message') {
      message = _.get(message, 'events[0].message')
      const type = _.get(message, 'type')

      if (type === 'text') {
        msg.attachment = {
          type: 'text',
          content: message.text,
        }
      } else if (type === 'image') {
        msg.attachment = {
          type: 'picture',
          content: message.id,
        }
      } else if (type === 'video') {
        msg.attachment = {
          type: 'video',
          content: message.id,
        }
      } else {
        throw new BadRequestError('Message type non-supported by Line')
      }
    } else if (eventType === 'postback') {
      const content = _.get(message, 'postback')
      msg.attachment = { type: 'payload', content }
    }

    return msg
  }

  static formatButtons (buttons, characterLimit = labelCharacterLimit) {
    return buttons.map(button => {
      const { title: label } = button
      const type = button.type || 'text'
      const value = button.value || button.url

      // Line is restrictive in terms of label length. Different lengths
      // are allowed for carousel (12 chars) vs. other templates (e.g. buttons)
      // see https://developers.line.me/en/reference/messaging-api/#action-objects
      if (['text', 'phonenumber', 'element_share'].indexOf(type) !== -1) {
        return { type: 'message', label: label.slice(0, characterLimit), text: value }
      } else if (type === 'web_url') {
        return { type: 'uri', label: label.slice(0, characterLimit), uri: value }
      } else if (type === 'postback') {
        return { type, label: label.slice(0, characterLimit), data: value, text: value }
      }
      return { type }
    })
  }

  formatOutgoingMessage (conversation, message) {
    const { type, content } = _.get(message, 'attachment')

    if (type === 'text') {
      return {
        type,
        text: content,
      }
    } else if (type === 'picture') {
      return {
        type: 'image',
        originalContentUrl: content,
        previewImageUrl: content,
      }
    } else if (type === 'video') {
      return {
        type: 'video',
        originalContentUrl: content,
        // needs preview image
        previewImageUrl:
          'https://portfolium.cloudimg.io/s/crop/128x128/'
        + 'https://cdn.portfolium.com/img%2Fdefaults%2Fdefault.jpg',
      }
    } else if (type === 'card') {
      const { title, imageUrl: thumbnailImageUrl, subtitle: text, buttons } = content
      const actions = Line.formatButtons(buttons)

      return {
        type: 'template',
        altText: title,
        template: {
          type: 'buttons',
          thumbnailImageUrl,
          title,
          text,
          actions,
        },
      }
    } else if (type === 'quickReplies' || type === 'buttons') {
      const templateType = type === 'buttons' ? type : 'confirm'
      const { title, buttons } = content
      const actions = Line.formatButtons(buttons)

      return {
        type: 'template',
        altText: title,
        template: {
          type: templateType,
          text: title,
          actions,
        },
      }
    } else if (type === 'list') {
      const { elements, buttons } = content
      const actions = Line.formatButtons(buttons)

      return _.map(elements, ({ title, imageUrl: thumbnailImageUrl, subtitle: text, buttons }) => {
        const actions = Line.formatButtons(buttons)
        return {
          type: 'template',
          altText: title,
          template: {
            type: 'buttons',
            thumbnailImageUrl,
            title,
            text,
            actions,
          },
        }
      })
      .concat([{
        type: 'template',
        altText: 'actions',
        template: {
          type: 'confirm',
          text: 'Confirm',
          actions,
        },
      }])
    } else if (type === 'carousel' || type === 'carouselle') {
      const elements = _.map(content, ({ title,
                                         imageUrl: thumbnailImageUrl,
                                         subtitle: text,
                                         buttons }) => {
        const actions = Line.formatButtons(buttons, carouselLabelCharacteLimit)
        return {
          thumbnailImageUrl,
          title,
          text,
          actions,
        }
      })

      return {
        type: 'template',
        altText: 'carousel',
        template: {
          type: 'carousel',
          columns: elements,
        },
      }
    } else if (type === 'custom') {
      return content
    }

    throw new BadRequestError('Message type non-supported by Line')
  }

  async sendMessages (conversation, messages) {
    await lineSendMessage(conversation.channel.token, conversation.replyToken, messages)
    return true
  }

  async sendMessage (conversation, message) {
    await lineSendMessage(conversation.channel.token, conversation.replyToken, [message])
    return true
  }

  /*
   * Gromit methods
   */

  async populateParticipantData (participant, channel) {
    try {
      const data = await lineGetUserProfile(channel.token, participant.senderId)

      participant.data = data
      return participant.save()
    } catch (error) {
      return participant
    }
  }

  parseParticipantDisplayName (participant) {
    const informations = {}

    if (participant.data) {
      const { displayName } = participant.data
      informations.userName = displayName
    }

    return informations
  }

}
