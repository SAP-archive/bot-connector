import _ from 'lodash'
import MessageController from './messages'
import { getChannelIntegrationByIdentifier } from '../channel_integrations'
import WebhookController from './webhooks'
import { Channel, Conversation, Message, Participant } from '../models'
import { logger, sendToWatchers } from '../utils'
import { BadRequestError, NotFoundError } from '../utils/errors'

/**
 * Encapsulates handling of a message sent to a channel's webhook.
 * Currently a WIP: First move all "controller" and "util" functions into this class, then refactor.
 */
class MessagePipe {
  constructor (channel, context) {
    this.channel = channel
    this.messageContext = context
    this.channelIntegration = getChannelIntegrationByIdentifier(channel.type)
  }

  /**
   * Runs the message pipe for a given input message
   * @param message The message to be processed
   * @return {Promise<*>} The response object returned by the bot
   */
  async run (message) {
    let conversation = await this.findOrCreateConversation()
    conversation = this.channelIntegration.updateConversationContextFromMessage(
      conversation, message)
    await conversation.save()

    this.messageContext.mentioned = true
    const parsedMessage = await this.parseIncomingMessage(conversation, message)
    const memoryOptions = await this.getMemoryOptions(message)
    const savedMessage = await this.saveMessage(conversation, parsedMessage)
    await this.sendMessageToWatchers(conversation, savedMessage)
    if (this.channel.connector.isTyping) {
      const echo = _.get(message, 'entry[0].messaging[0]', {})
      // don't send isTyping if the message is an echo from facebook
      if (this.channel.type !== 'messenger' || (echo.message && !(echo.is_echo && echo.app_id))) {
        await this.channelIntegration.onIsTyping(
          this.channel, this.messageContext)
      }
    }

    const botResponse = await WebhookController.sendMessageToBot(
      [conversation, savedMessage, memoryOptions, this.messageContext]
    )
    // save original response from rafiki / custom bot to context so it can be used later if needed
    this.messageContext.originalBotResponse = botResponse.results || botResponse
    return this.sendRepliesToChannel(conversation, botResponse)
  }

  async sendMessageToWatchers (conversation, message) {
    if (['webchat', 'recastwebchat'].includes(conversation.channel.type)) {
      try {
        message.participant = await Participant.findById(message.participant)
      } catch (err) {
        logger.error('Could not populate participant', err)
      }
      sendToWatchers(conversation._id, [message.serialize])
    }
  }

  async parseIncomingMessage (conversation, message) {
    return this.channelIntegration.parseIncomingMessage(
      conversation,
      message,
      this.messageContext)
  }

  async getMemoryOptions (message) {
    return this.channelIntegration.getMemoryOptions(message, this.messageContext)
  }

  async findOrCreateConversation () {
    const chatId = this.messageContext.chatId
    const channelId = this.channel._id
    let conversation
      = await Conversation.findOne({ channel: channelId, chatId, isActive: true })
      .populate('channel')
      .populate('connector')
      .exec()

    if (conversation && conversation.isActive) {
      return conversation
    }

    const channel = await Channel.findById(channelId).populate('connector').exec()

    if (!channel || !channel.isActive) {
      throw new NotFoundError('Channel')
    } else if (!channel.isActivated) {
      throw new BadRequestError('Channel is not activated')
    }

    const connector = channel.connector

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    conversation = await new Conversation({
      connector: connector._id,
      chatId,
      channel: channel._id,
    }).save()

    conversation.connector = connector
    conversation.channel = channel
    return conversation
  }

  async sendRepliesToChannel (conversation, replies) {
    const { results } = replies
    let { messages } = replies
    // Rafiki sends a json with an object "results" wrapping data
    // Since we decided that it would be weird for users to do the same thing
    // We look for the object "messages" both at the root and in results
    if (results && results.messages) {
      messages = results.messages
      _.set(this.messageContext, 'memory', _.get(results, 'conversation.memory', {}))
    } else {
      _.set(this.messageContext, 'memory', _.get(replies, 'conversation.memory', {}))
    }

    if (!messages) {
      return []
    }
    messages = MessageController.checkAndTransformMessages(messages)
    return MessageController.sendMessagesToChannel(
      [conversation, messages, this.messageContext])
  }

  async saveMessage (conversation, message) {
    let participant = await Participant.findOne({
      conversation: conversation._id,
      senderId: this.messageContext.senderId,
    })

    if (!participant) {
      participant = await new Participant({
        conversation: conversation._id,
        senderId: this.messageContext.senderId,
        type: 'user',
      }).save()
    }
    try {
      const updatedParticipant
        = await this.channelIntegration.populateParticipantData(participant, conversation.channel)
      participant = updatedParticipant
    } catch (err) {
      logger.error(`Unable to get user infos: ${err}`)
    }

    const newMessage = new Message({
      participant: participant._id,
      conversation: conversation._id,
      attachment: message.attachment,
    })

    if (_.get(message, 'newMessage.attachment.delay')) {
      newMessage.delay = newMessage.attachment.delay
    }

    this.messageContext.participantData
      = this.channelIntegration.parseParticipantDisplayName(participant)

    return newMessage.save()
  }

}

export default MessagePipe
