import request from 'superagent'
import uuidV4 from 'uuid/v4'
import _ from 'lodash'

import { logger, renderPolledMessages } from '../utils'
import { renderCreated, renderOk } from '../utils/responses'
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors'
import { Channel, Conversation, Message, Participant, PersistentMenu } from '../models'
import WebhookController from '../controllers/webhooks'
import messageQueue from '../utils/message_queue'
import { getChannelIntegrationByIdentifier } from '../channel_integrations'
import MessagePipe from './message_pipe'

export default class WebhooksController {

  static async serviceHandleMethodAction (req, res) {
    const channel_type = req.params.channel_type
    const channelIntegration = getChannelIntegrationByIdentifier(channel_type)
    if (!channelIntegration) {
      throw new BadRequestError('Channel type does not exist')
    }
    const messageMethods = channelIntegration.webhookHttpMethods()
    /* Requests made on methods declared in 'webhookHttpMethods' for a channel type
       will be treated as an incoming message */
    if (messageMethods.includes(req.method)) {
      const identityPairs = channelIntegration.getIdPairsFromSharedWebhook(req, res)
      if (!identityPairs) {
        throw new NotFoundError('Channel identity')
      }
      const channel = await Channel
        .find({
          ...identityPairs,
          isActive: true,
        })
        .sort({ createdAt: -1 })
        .limit(1)
        .populate({ path: 'children connector' })
        .cursor()
        .next()
      if (!channel) {
        throw new NotFoundError('Channel')
      }

      await WebhookController.forwardMessage(req, res, channel)
      return
    }

    /* Requests made on other methods will be treated as a subscription request */
    await WebhookController.serviceSubscribeWebhook(req, res, channel_type)
  }

  static async serviceSubscribeWebhook (req, res, channel_type) {
    const channelIntegration = getChannelIntegrationByIdentifier(channel_type)
    return channelIntegration.onSharedWebhookChecking(req, res)
  }

  static async handleMethodAction (req, res) {
    const channel_id = req.params.channel_id
    const channel = await Channel
      .findById(channel_id)
      .populate({ path: 'children connector' })

    if (!channel) {
      throw new NotFoundError('Channel')
    }
    const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
    const messageMethods = channelIntegration.webhookHttpMethods()
    /* Requests made on methods declared in 'webhookHttpMethods' for a channel type
       will be treated as an incoming message */
    if (messageMethods.includes(req.method)) {
      await WebhookController.forwardMessage(req, res, channel)
      return
    }

    /* Requests made on other methods will be treated as a subscription request */
    try {
      await WebhookController.subscribeWebhook(req, res, channel)
    } catch (e) {
      throw new BadRequestError('Unimplemented service method')
    }

  }

  static async forwardMessage (req, res, channel) {
    if (!channel.isActivated) {
      throw new BadRequestError('Channel is not activated')
    }
    const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
    await channelIntegration.authenticateWebhookRequest(req, res, channel)
    channel = await channelIntegration.onWebhookCalled(req, res, channel)
    const context = await channelIntegration.populateMessageContext(req, res, channel)
    const message = channelIntegration.getRawMessage(channel, req, context)
    const pipe = new MessagePipe(channel, context)
    const botResponse = await pipe.run(message)
    channelIntegration.finalizeWebhookRequest(req, res, context, botResponse)
    if (!res.finished) {
      const warning
        = `${channel.type} channel did not finalize webhook request. Sending default response`
      logger.warning(warning)
      res.status(200).json({ results: null, message: 'Message successfully received' })
    }
  }

  static async subscribeWebhook (req, res, channel) {
    const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
    return channelIntegration.validateWebhookSubscriptionRequest(req, res, channel)
  }

  static async createConversation (req, res) {
    const authorization = req.headers.authorization
    const channel_id = req.params.channel_id
    const channel = await Channel.findById(channel_id)
      .populate('connector').exec()

    if (!channel) { throw new NotFoundError('Channel') }
    if (!['webchat', 'recastwebchat'].includes(channel.type)) {
      throw new BadRequestError('Invalid channel type')
    }
    if (channel.token !== authorization) { throw new ForbiddenError() }

    const conversation = await new Conversation({
      connector: channel.connector._id,
      channel: channel._id,
      chatId: 'tmp',
    }).save()
    conversation.chatId = conversation._id.toString()

    await conversation.save()

    if (channel.forwardConversationStart) {
      const message = { message: { attachment: { type: 'conversation_start', content: '' } } }
      const context = {
        chatId: conversation.chatId,
        senderId: `p-${conversation.chatId}`,
      }
      const pipe = new MessagePipe(channel, context)
      await pipe.run(message)
    }

    const result = conversation.full
    result.participants = await Participant.find({ conversation: conversation._id })
    result.participants = result.participants.map(p => p.serialize)
    result.messages = await Message
      .find({ conversation: conversation._id, isActive: true })
      .sort('receivedAt')
    result.messages = result.messages.map(m => m.serialize)

    return renderCreated(res, {
      results: result,
      message: 'Conversation successfully created',
    })
  }

  static async getMessages (req, res) {
    const authorization = req.headers.authorization
    const channel_id = req.params.channel_id
    const conversation_id = req.params.conversation_id
    const channel = await Channel.findById(channel_id)

    if (!channel) { throw new NotFoundError('Channel') }
    if (channel.token !== authorization) { throw new ForbiddenError() }

    const conversation = await Conversation
      .findOne({ channel: channel_id, _id: conversation_id })
    if (!conversation) { throw new NotFoundError('Conversation') }

    const messages = await Message
      .find({ conversation: conversation._id })
      .populate('participant')
      .sort('receivedAt')

    return renderOk(res, {
      message: 'Messages successfully fetched',
      results: messages.map(m => m.serialize),
    })
  }

  static async poll (req, res) {
    const authorization = req.headers.authorization
    const channel_id = req.params.channel_id
    const conversation_id = req.params.conversation_id
    const last_message_id = req.query.last_message_id
    const channel = await Channel.findById(channel_id)

    if (!channel) { throw new NotFoundError('Channel') }
    if (!['webchat', 'recastwebchat'].includes(channel.type)) {
      throw new BadRequestError('Invalid channel type')
    }
    if (channel.token !== authorization) { throw new ForbiddenError() }

    const conversation
      = await Conversation.findOne({ channel: channel_id, _id: conversation_id })
    if (!conversation) { throw new NotFoundError('Conversation') }

    let since = conversation.createdAt - 1
    if (last_message_id) {
      const lastMessage = await Message.findOne({
        conversation: conversation._id,
        _id: last_message_id,
      })
      if (!lastMessage) { throw new NotFoundError('Message') }
      since = lastMessage.receivedAt
    }

    WebhookController.watchConversation(req, res, conversation._id, since)
  }

  static closeRequestClosure (res, convId, watcherId) {
    let closed = false
    return (messages, waitTime) => {
      if (closed) { return }
      closed = true
      waitTime = waitTime ? waitTime : 0
      renderPolledMessages(res, messages, waitTime)
      messageQueue.removeWatcher(convId, watcherId)
    }
  }

  static async watchConversation (req, res, convId, since) {
    const watcherId = uuidV4()
    const closeRequest = WebhookController.closeRequestClosure(res, convId, watcherId)
    req.once('close', () => closeRequest([]))
    setTimeout(() => closeRequest([]), 30 * 1000)
    messageQueue.setWatcher(convId, watcherId, closeRequest)
    // important to query the db after we set a watcher, otherwise we might miss messages
    const newMessages = await Message
      .find({ conversation: convId, receivedAt: { $gt: since } })
      .sort('receivedAt')
      .populate('participant')
    if (newMessages.length > 0) { return closeRequest(newMessages.map(m => m.serialize)) }
    // more than two minutes ago, wait for two minutes
    if (Date.now() - since > 2 * 60 * 1000) {
      return closeRequest([], 120)
    }
  }

  static async getPreferences (req, res) {
    const authorization = req.headers.authorization
    const channel_id = req.params.channel_id
    const channel = await Channel.findById(channel_id)

    if (!channel) { throw new NotFoundError('Channel') }
    if (!['webchat', 'recastwebchat'].includes(channel.type)) {
      throw new BadRequestError('Invalid channel type')
    }
    if (channel.token !== authorization) { throw new ForbiddenError() }

    const preferences = {
      accentColor: channel.accentColor,
      complementaryColor: channel.complementaryColor,
      botMessageColor: channel.botMessageColor,
      botMessageBackgroundColor: channel.botMessageBackgroundColor,
      backgroundColor: channel.backgroundColor,
      headerLogo: channel.headerLogo,
      headerTitle: channel.headerTitle,
      botPicture: channel.botPicture,
      userPicture: channel.userPicture,
      onboardingMessage: channel.onboardingMessage,
      userInputPlaceholder: channel.userInputPlaceholder,
      expanderLogo: channel.expanderLogo,
      expanderTitle: channel.expanderTitle,
      conversationTimeToLive: channel.conversationTimeToLive,
      openingType: channel.openingType,
      welcomeMessage: channel.welcomeMessage,
      characterLimit: channel.characterLimit,
    }

    try {
      const locale = channel.webchatLocale
      preferences.menu = locale
        ? await PersistentMenu.findOne({ connector_id: channel.connector.id, locale })
        : await PersistentMenu.findOne({ connector_id: channel.connector.id, default: true })
    } catch (err) {
      console.log('preferences', err) // eslint-disable-line
    }

    renderOk(res, {
      message: 'Preferences successfully rendered',
      results: preferences,
    })
  }

  static sendMessageToBot ([conversation, message, memoryOptions, context]) {
    // Don't send a message to the bot if the message is empty (Nil)
    if (_.isEmpty(_.get(message, 'attachment.content', null))) {
      return new Promise((resolve) => resolve({}))
    }

    const participantData = context.participantData
    const { chatId, senderId, mentioned } = context
    const origin = conversation.channel.type

    if (participantData) {
      message.data = participantData
    }

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }

    return request.post(conversation.connector.url)
      .set(headers)
      .send({
        message,
        chatId,
        senderId,
        mentioned,
        origin,
        memory: memoryOptions.memory,
        merge_memory: memoryOptions.merge,
      })
      .then((response) => response.body)
  }

}
