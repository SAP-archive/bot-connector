import _ from 'lodash'

import Logger from '../utils/Logger'
import { invoke, invokeSync } from '../utils'
import { renderCreated } from '../utils/responses'
import { isValidFormatMessage } from '../utils/format'
import { NotFoundError, BadRequestError, ServiceError } from '../utils/errors'

export default class MessagesController {

  static async pipeMessage (id, message, options) {
    return global.controllers.Conversations.findOrCreateConversation(id, options.chatId)
      .then(conversation => global.controllers.Messages.updateConversationWithMessage(conversation, message, options))
      .then(global.controllers.Messages.parseChannelMessage)
      .then(global.controllers.Messages.saveMessage)
      .then(global.controllers.Webhooks.sendMessageToBot)
  }

  static parseChannelMessage ([conversation, message, options]) {
    return invoke(conversation.channel.type, 'parseChannelMessage', [conversation, message, options])
  }

  static async saveMessage ([conversation, message, options]) {
    let participant = _.find(conversation.participants, p => p.senderId === options.senderId)
    const type = conversation.channel.type

    if (!participant) {
      participant = await new global.models.Participant({ senderId: options.senderId }).save()

      await global.models.Conversation.update({ _id: conversation._id }, { $push: { participants: participant._id } })
      conversation.participants.push(participant)
    }

    const newMessage = new global.models.Message({
      participant: participant._id,
      conversation: conversation._id,
      attachment: message.attachment,
    })

    conversation.messages.push(newMessage)

    return Promise.all([
      conversation,
      newMessage.save(),
      options,
      global.models.Conversation.update({ _id: conversation._id }, { $push: { messages: newMessage._id } }),
    ])
  }

  /**
   * Check if all the messages received from the bot are well formatted
   */
  static async bulkCheckMessages ([conversation, messages, opts]) {
    if (!Array.isArray(messages)) {
      throw new BadRequestError('Message is not well formated')
    }

    for (const message of messages) {
      if (!isValidFormatMessage(message)) {
        throw new BadRequestError('Message is not well formated')
      }
    }

    return Promise.all([conversation, messages, opts])
  }

  /**
   * Save an array of message in db
   */
  static async bulkSaveMessages ([conversation, messages, opts]) {
    let participant = _.find(conversation.participants, p => p.isBot)

    if (!participant) {
      participant = await new global.models.Participant({ senderId: conversation.connector._id, isBot: true }).save()
      conversation.participants.push(participant)
    }

    messages = await Promise.all(messages.map(attachment => {
      const newMessage = new global.models.Message({
        participant: participant._id,
        conversation: conversation._id,
        attachment,
      })
      conversation.messages.push(newMessage)
      return newMessage.save()
    }))

    return Promise.all([
      conversation.save(),
      messages,
      opts,
    ])
  }

  /**
   * Format an array of messages
   */
  static async bulkFormatMessages ([conversation, messages, options]) {
    const channelType = conversation.channel.type

    messages = messages
      .filter(message => !message.attachment.only || message.attachment.only.indexOf(channelType) !== -1)

    messages = await Promise.all(messages
      .map(async (message) => {
        const res = await invoke(channelType, 'formatMessage', [conversation, message, options])
        return Array.isArray(res) ? res : [res]
      }))

    // flattening
    messages = [].concat.apply([], messages)
    return Promise.resolve([conversation, messages, options])
  }

  /**
   * Send an array of messages to the bot
   */
  static async bulkSendMessages ([conversation, messages, opts]) {
    const channelType = conversation.channel.type

    for (const message of messages) {
      try {
        await invoke(channelType, 'sendMessage', [conversation, message, opts])
      } catch (err) {
        throw new ServiceError('Error while sending message', err)
      }
    }

    return ([conversation, messages, opts])
  }

  static async postMessage (req, res) {
    const { connector_id, conversation_id } = req.params
    let { messages } = req.body

    if (!messages) {
      throw new BadRequestError('Invalid \'messages\' parameter')
    } else if (typeof messages === 'string') {
      try {
        messages = JSON.parse(messages)
      } catch (err) {
        throw new BadRequestError('Invalid \'messages\' parameter')
      }
    }

    const conversation = await global.models.Conversation.findOne({ _id: conversation_id, connector: connector_id })
          .populate('participants channel connector').exec()

    if (!conversation) { throw new NotFoundError('Conversation') }

    const participant = conversation.participants.find(p => !p.isBot)
    if (!participant) { throw new NotFoundError('Participant') }

    const opts = {
      senderId: participant.senderId,
      chatId: conversation.chatId,
    }

    await global.controllers.Messages.bulkCheckMessages([conversation, messages, opts])
      .then(global.controllers.Messages.bulkSaveMessages)
      .then(global.controllers.Messages.bulkFormatMessages)
      .then(global.controllers.Messages.bulkSendMessages)

    return renderCreated(res, { results: null, message: 'Messages successfully posted' })
  }

  static async postToConversation (conversation, messages) {
    for (const participant of conversation.participants) {
      if (participant.isBot) { continue }

      const opts = {
        chatId: conversation.chatId,
        senderId: participant.senderId,
      }

      await new Promise((resolve, reject) => {
        MessagesController.bulkSaveMessages([conversation, messages, opts])
          .then(MessagesController.bulkFormatMessages)
          .then(MessagesController.bulkSendMessages)
          .then(resolve)
          .catch(reject)
      })
    }
  }

  static async broadcastMessage (req, res) {
    const { connector_id } = req.params
    let { messages } = req.body

    if (!messages || !Array.isArray(messages)) {
      throw new BadRequestError('Invalid messages parameter')
    } else if (typeof messages === 'string') {
      try {
        messages = JSON.parse(messages)
      } catch (e) {
        throw new BadRequestError('Invalid messages parameter')
      }
    }

    const connector = await models.Connector.findById(connector_id).populate('conversations')

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    for (const conversation of connector.conversations) {
      try {
        await global.controllers.Messages.postToConversation(conversation, messages)
      } catch (err) {
        Logger.error('Error while broadcasting message', err)
      }
    }

    return renderCreated(res, { results: null, message: 'Messages successfully posted' })
  }

  /*
   * Helpers
   */

  static async updateConversationWithMessage (conversation, message, options) {
    return invoke(conversation.channel.type, 'updateConversationWithMessage', [conversation, message, options])
  }

}
