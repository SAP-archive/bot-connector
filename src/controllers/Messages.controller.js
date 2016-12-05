import _ from 'lodash'
import WebhooksController from '../controllers/Webhooks.controller'
import { invoke, invokeSync } from '../utils'
import { isValidFormatMessage } from '../utils/format'
import {
  FormatError,
  DisableError,
  notFoundError,
  ConnectorError,
  handleMongooseError,
} from '../utils/errors'

export default class MessagesController {

  /**
   * > Pipeline
   * - take a message from a channel as input
   * - parse it and save it in db
   * - send it to bot url
   * - save bot replies in dbs
   * - send bot replies back to channel
   */
  static async pipeMessage (channelId, message, opts) {
    const { chatId } = opts

    return MessagesController.findOrCreateConversation(channelId, chatId)
      .then(conversation => MessagesController.parseChannelMessage(conversation, message, opts))
      .then(MessagesController.saveMessage)
      .then(WebhooksController.sendMessageToBot)
  }

  /**
   * Find or create a new conversation
   */
  static async findOrCreateConversation (channelId, chatId) {
    let conversation = await Conversation.findOne({ channel: channelId, chatId })
      .populate('channel bot participants messages').exec()
    if (conversation && conversation.isActive) { return conversation }

    const channel = await Channel.findById(channelId).populate('bot').exec()
    if (!channel) { throw new notFoundError('Channel') }
    if (!channel.isActivated) { throw new DisableError('Channel') }
    const { bot } = channel
    if (!bot) { throw new notFoundError('Bot') }

    conversation = await new Conversation({ bot, chatId, channel }).save()
    bot.conversations.push(conversation._id)
    await bot.save()

    return conversation
  }

  /**
   * Parse a message received from a channel
   */
  static parseChannelMessage (conversation, message, opts) {
    const channelType = conversation.channel.type

    return invoke(channelType, 'parseChannelMessage', [conversation, message, opts])
  }

  /**
   * Save a message in db
   */
  static async saveMessage ([conversation, message, opts]) {
    let participant = _.find(conversation.participants, p => p.senderId === opts.senderId)
    if (!participant) {
      participant = await new Participant({ senderId: opts.senderId }).save()
      conversation.participants.push(participant)
    }

    const newMessage = new Message({
      participant: participant._id,
      conversation: conversation._id,
      attachment: message.attachment,
    })
    conversation.messages.push(newMessage)

    return Promise.all([
      conversation.save(),
      newMessage.save(),
      opts,
    ])
  }

  /**
   * Check if all the messages received from the bot are well formatted
   */
  static async bulkCheckMessages ([conversation, messages, opts]) {
    if (!Array.isArray(messages)) {
      throw new FormatError('Message is not well formated')
    }
    for (const message of messages) {
      if (!isValidFormatMessage(message)) {
        throw new FormatError('Message is not well formated')
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
      participant = await new Participant({ senderId: conversation.bot._id, isBot: true }).save()
      conversation.participants.push(participant)
    }

    messages = await Promise.all(messages.map(attachment => {
      const newMessage = new Message({
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
  static bulkFormatMessages ([conversation, messages, opts]) {
    const channelType = conversation.channel.type

    messages = messages.map(message => invokeSync(channelType, 'formatMessage', [conversation, message, opts]))

    return Promise.resolve([conversation, messages, opts])
  }

  static sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Send an array of messages to the bot
   */
  static async bulkSendMessages ([conversation, messages, opts]) {
    const channelType = conversation.channel.type

    for (const message of messages) {
      let err = null

      // Try 3 times to send the message
      for (let i = 0; i < 3; i++) {
        try {
          await invoke(channelType, 'sendMessage', [conversation, message, opts])
          break
        } catch (ex) {
          await MessagesController.sleep(2000)
          err = ex
        }
      }

      if (err) {
        throw new ConnectorError(`Unable to send message to channel: ${err}`)
      }
    }

    return ([conversation, messages, opts])
  }

  /**
   * Post from a bot to a channel
   */
  static async postMessage (req, res) {
    const { conversation_id } = req.params
    const { senderId, chatId } = req.body
    let { messages } = req.body
    const opts = { senderId, chatId }

    if (!messages) {
      res.status(400).json({ message: 'Invalid \'messages\' parameter', results: null })
      return
    } else if (typeof messages === 'string') {
      try {
        messages = JSON.parse(messages)
      } catch (e) {
        res.status(400).send('Invalid \'messages\' parameter')
        return
      }
    }

    let convers = null

    Conversation.findById(conversation_id)
      .populate('participants channel bot')
      .exec()
      .then(conversation => {
        convers = conversation
        if (!conversation) { throw new notFoundError('Conversation') }
        return MessagesController.bulkCheckMessages([conversation, messages, opts])
      })
      .then(MessagesController.bulkSaveMessages)
      .then(MessagesController.bulkFormatMessages)
      .then(MessagesController.bulkSendMessages)
      .then(() => res.status(201).json({ results: null, message: 'Messages successfully posted' }))
      .catch(err => {
        if (err instanceof ConnectorError) {
          res.status(503).json({
            message: `An error occured while sending message to ${convers.channel.slug}`,
            results: {
              channel: {
                type: convers.channel.type,
                slug: convers.channel.slug,
              },
              conversation: convers.id,
            },
          })
        } else {
          handleMongooseError(err, res, 'Error while posting messages')
        }
      })
  }

  static async postToConversation (conversation, messages) {
    for (let participant of conversation.participants) {
      participant = await Participant.findOne({ _id: participant })
      const opts = {
        chatId: conversation.chatId,
        senderId: participant.senderId,
      }
      await new Promise((resolve, reject) => {
        MessagesController.bulkSaveMessages([conversation, messages, opts])
        .then(MessagesController.bulkFormatMessages)
        .then(MessagesController.bulkSendMessages)
        .catch(reject)
      })
    }
  }

  /**
   * Post message to a bot
   */
  static async postMessages (req, res) {
    let { messages } = req.body

    if (typeof messages === 'string') {
      try {
        messages = JSON.parse(messages)
      } catch (e) {
        res.status(400).json({ result: null, message: 'Invalid \'messages\' parameter' })
        return
      }
    }

    try {
      const bot = await Bot.findById(req.params.bot_id).populate({
        path: 'conversations', populate: { path: 'channel', model: 'Channel' },
      }).exec()

      for (const conversation of bot.conversations) {
        await MessagesController.postToConversation(conversation, messages)
      }
      res.status(201).json({ results: null, message: 'Messages successfully posted' })
    } catch (ex) {
      res.status(500).json({ results: null, message: 'Error while posting message' })
    }
  }
}
