import _ from 'lodash'
import { logger } from '../utils'
import { renderCreated } from '../utils/responses'
import { isValidFormatMessage } from '../utils/format'
import { BadRequestError, NotFoundError, ServiceError } from '../utils/errors'
import { Connector, Conversation, Message, Participant } from '../models'
import MessageController from '../controllers/messages'
import { getChannelIntegrationByIdentifier } from '../channel_integrations'

export default class MessagesController {

  static checkAndTransformMessages (messages) {
    if (!messages) {
      throw new BadRequestError('Invalid \'messages\' parameter')
    } else if (typeof messages === 'string') {
      try {
        messages = JSON.parse(messages)
      } catch (err) {
        throw new BadRequestError('Invalid \'messages\' parameter')
      }
    }
    return messages
  }

  static async sendMessagesToChannel ([conversation, messages, context]) {
    let participant = await Participant.findOne({
      conversation: conversation._id,
      isBot: true,
      type: context.type,
    })

    if (!participant) {
      participant = await new Participant({
        conversation: conversation._id,
        senderId: conversation.connector._id,
        isBot: true,
        type: context.type,
      }).save()
    }

    messages = await MessageController.bulkSetCorrectDelayForMessages([conversation, messages])
    const returned_messages = []
    for (const message of messages) {
      await MessageController.checkMessage([conversation, message, context])
        .then(async ([conversation, message, context]) => {
          [conversation, message, context]
            = await MessageController.saveMessage(conversation, message, context, participant)
          return [conversation, message, context, message.delay]
        })
        .then(MessageController.formatMessage)
        .then(([conversation, message, context, delay]) => {
          returned_messages.push(message)
          return MessageController.sendMessage([conversation, message, context, delay])
        })
    }
    return returned_messages
  }

  static async postMessage (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    let messages = req.body.messages
    const conversationId = req.params.conversationId

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    messages = MessageController.checkAndTransformMessages(messages)

    const conversation = await Conversation
      .findOne({ _id: conversationId, connector: connector._id })
      .populate('channel connector')
      .exec()

    if (!conversation) { throw new NotFoundError('Conversation') }

    const participant = await Participant
      .findOne({ conversation: conversation._id, isBot: false })
    if (!participant) { throw new NotFoundError('Participant') }

    const context = {
      senderId: participant.senderId,
      chatId: conversation.chatId,
    }

    await MessageController.sendMessagesToChannel([conversation, messages, context])

    return renderCreated(res, { results: null, message: 'Messages successfully posted' })
  }

  static async broadcastMessage (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    let messages = req.body.messages

    if (!messages || !Array.isArray(messages)) {
      throw new BadRequestError('Invalid messages parameter')
    } else if (typeof messages === 'string') {
      try {
        messages = JSON.parse(messages)
      } catch (e) {
        throw new BadRequestError('Invalid messages parameter')
      }
    }

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const conversations
      = await Conversation.find({ connector: connector._id, isActive: true })
    for (const conversation of conversations) {
      try {
        await MessageController.postToConversation(conversation, messages)
      } catch (err) {
        logger.error(`Error while broadcasting message: ${err}`)
      }
    }

    return renderCreated(res, { results: null, message: 'Messages successfully posted' })
  }

  /*
   * Helpers
   */

  /**
   * Check if the message received is well formatted
   */
  static async checkMessage ([conversation, message, context]) {
    if (!isValidFormatMessage(message)) {
      throw new BadRequestError('Message is not well formatted')
    }

    return Promise.all([conversation, message, context])
  }

  /**
   * Save a message in db
   */
  static async saveMessage (conversation, message, context, participant) {
    if (!context.type) {
      context.type = 'bot'
    }

    const now = Date.now()

    const newMessage = new Message({
      participant: participant._id,
      conversation: conversation._id,
      attachment: message,
      receivedAt: now,
    })
    if (message.delay) {
      newMessage.delay = message.delay
    }
    await newMessage.save()

    return Promise.all([
      conversation,
      newMessage,
      context,
    ])
  }

  /**
   * Extract the delay from the message and format the message.
   * Go through each message, and set the message delay
   * either to the specific delay provided in the message
   * or to the default delay if it's not the last message
   */
  static async bulkSetCorrectDelayForMessages ([conversation, messages]) {
    const messages_length = messages.length
    messages.map((message, i) => {
      let message_delay = message.delay
      if (!message_delay && message_delay !== 0 && conversation.connector.defaultDelay) {
        if (i === messages_length - 1) {
          message_delay = 0
        } else {
          message_delay = conversation.connector.defaultDelay
        }
      } else {
        if (!_.isFinite(message_delay) || message_delay < 0) {
          message_delay = 0
        }
        if (message_delay > 5) {
          message_delay = 5
        }
      }
      message.delay = message_delay
      return message
    })

    return messages
  }

  /**
   * Format a message
   */
  static async formatMessage ([conversation, message, context, delay]) {
    const channelType = conversation.channel.type

    if (message.attachment.only && !message.attachment.only.indexOf(channelType) !== -1) {
      return Promise.resolve()
    }
    const channelIntegration = getChannelIntegrationByIdentifier(channelType)
    message = await channelIntegration.formatOutgoingMessage(conversation, message, context)
    return Promise.resolve([conversation, message, context, delay])
  }

  static async delayNextMessage (delay, conversation, channelIntegration, context) {
    if (delay) {
      if (conversation.connector.isTyping) {
        await channelIntegration.onIsTyping(conversation.channel, context)
      }
      return new Promise(resolve => setTimeout(resolve, delay * 1000))
    }
  }

  /**
   * Send a message to the user
   */
  static async sendMessage ([conversation, message, context, delay]) {
    const channelType = conversation.channel.type
    const channelIntegration = getChannelIntegrationByIdentifier(channelType)
    try {
      await channelIntegration.sendMessage(conversation, message, context)
      await MessageController.delayNextMessage(delay, conversation, channelIntegration, context)
    } catch (err) {
      logger.error('Failed to send messages', err)
      throw new ServiceError('Error while sending message', err)
    }
  }

  static async postToConversation (conversation, messages) {
    const participants
      = await Participant.find({ conversation: conversation._id, isBot: false })
    for (const participant of participants) {
      const context = {
        chatId: conversation.chatId,
        senderId: participant.senderId,
      }

      messages = await MessageController.bulkSetCorrectDelayForMessages([conversation, messages])
      for (const message of messages) {
        await MessagesController.saveMessage([conversation, message, context], participant)
          .then(MessagesController.formatMessage)
          .then(MessagesController.sendMessage)
      }
    }
  }

}
