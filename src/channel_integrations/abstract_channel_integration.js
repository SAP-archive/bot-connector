import { noop } from '../utils'
import config from '../../config'

export class NotImplementedError extends Error {
  constructor (method) {
    super(`Implement ${method} in class AbstractChannelIntegration`)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotImplementedError)
    }

    this.method = method
  }
}

/* eslint no-unused-vars: 0 */  // --> OFF for abstract methods

/**
 * Abstract base class for custom channel integrations.
 */
export class AbstractChannelIntegration {

  /**
   * Can be overwritten by subclasses to customize the HTTP response that
   * is sent for a request to the channel's webhook.
   * @param {http.IncomingMessage} req HTTP request
   * @param {http.ServerResponse} res HTTP response
   * @param {Object} context Context from {@link populateMessageContext}
   * @param {Object[]} botResponse The bot's response to the request's input message
   */
  finalizeWebhookRequest (req, res, context, botResponse) {
    res.status(200).json({ results: null, message: 'Message successfully received' })
  }

  /**
   * Validates properties of the channel model created or updated using the JSON request body
   * of the respective HTTP endpoint.
   * @param {Channel} channel An instance of the channel model
   * @throws {BadRequestError} Validation of channel object failed
   */
  validateChannelObject (channel) {
    // NOOP by default
  }

  /**
   * Gets called before the channel model gets persisted into the database.
   * @param {Channel} channel An instance of the channel model
   * @param {http.IncomingMessage} req HTTP request
   * @return {Promise} Promise which resolves when all operations executed successfully
   */
  beforeChannelCreated (channel, req) { return noop() }

  /**
   * Is called after the channel model is persisted in the database.
   * @param {Channel} channel An instance of the channel model
   * @param {http.IncomingMessage} req HTTP request
   * @return {Promise} Promise which resolves when all operations executed have been executed
   */
  afterChannelCreated (channel, req) { return noop() }

  /**
   * Gets called after the channel model was updated in the database.
   * @param {Channel} channel The updated channel model
   * @param {Channel} oldChannel The old channel model
   * @return {Promise} Promise which resolves when all operations executed successfully
   */
  afterChannelUpdated (channel, oldChannel) { return noop() }

  /**
   * Gets called before the channel model get deleted in the database.
   * @param {Channel} channel The deleted channel model
   * @throws {ForbiddenError} Authentication failed
   * @return {Promise} Promise which resolves when all operations executed successfully
   */
  beforeChannelDeleted (channel) { return noop() }

  /**
   * Gets called after the channel model was deleted in the database.
   * @param {Channel} channel The deleted channel model
   * @return {Promise} Promise which resolves when all operations executed successfully
   */
  afterChannelDeleted (channel) { return noop() }

  /**
   * Defines the HTTP methods that a caller can use to send messages to a channel's webhook.
   * @returns {string[]} List of HTTP methods
   */
  webhookHttpMethods () {
    return ['POST']
  }

  /**
   * Generates a URL for the channel's webhook. This is called during the creation of
   * a new channel. Only override this method if you need to change your channel's webhook URL
   * for a particular reason.
   * @param channel An instance of the channel model before being persisted
   * @return {string} A well-formed URL
   */
  buildWebhookUrl (channel) {
    return `${config.base_url}/v1/webhook/${channel._id}`
  }

  /**
   * Validates parameters of the request object for webhook subscriptions.
   * @param {http.IncomingMessage} req HTTP request
   * @param {http.ServerResponse} res HTTP response
   * @param {Channel} channel An instance of the channel model
   * @return {Promise} Promise which resolves when parameter validation succeeds
   */
  validateWebhookSubscriptionRequest (req, res, channel) {
    throw new NotImplementedError('validateWebhookSubscriptionRequest')
  }

  /**
   * Authenticates an HTTP request made against the channel's webhook.
   * @param {http.IncomingMessage} req HTTP request
   * @param {http.ServerResponse} res HTTP response
   * @param {Channel} channel An instance of the channel model
   * @throws {ForbiddenError} Authentication failed
   * @return {Promise} Promise which resolves when request authentication succeeds
   */
  authenticateWebhookRequest (req, res, channel) { return noop() }

  /**
   * Gets called before an HTTP request to the channel's webhook is processed.
   * @param {http.IncomingMessage} req HTTP request
   * @param {http.ServerResponse} res HTTP response
   * @param {Channel} channel An instance of the channel model
   * @return {Promise} Promise which resolves when all operations succeed
   */
  onWebhookCalled (req, res, channel) {
    return channel
  }

  /**
   * Retrieves context information from the HTTP request, such as chatId, senderId,
   * and channel-specific data.
   * @param {http.IncomingMessage} req HTTP request
   * @param {http.ServerResponse} res HTTP response
   * @param {Channel} channel An instance of the channel model
   * @return {Object} The context object for further message processing
   */
  populateMessageContext (req, res, channel) {
    throw new NotImplementedError('populateMessageContext')
  }

  /**
   * Reads the unparsed message from a request sent to the channel's webhook.
   * @param {Channel} channel An instance of the channel model
   * @param {http.IncomingMessage} req HTTP request
   * @param {Object} context Context from {@link populateMessageContext}
   * @return {Object} The raw message
   */
  getRawMessage (channel, req, context) {
    return req.body
  }

  /**
   * Gets called when the bot is ready to indicate that it is "typing". This hook can be
   * used to activate "isTyping" indicators in any external services.
   * @see populateMessageContext
   * @param {Channel} channel An instance of the channel model
   * @param {Object} context Context from {@link populateMessageContext}
   * @return {Promise} Promise which resolves when "isTyping" request was successful
   */
  onIsTyping (channel, context) { return noop() }

  /**
   * Can be implemented to update the current conersation based on a received message.
   * @param {Conversation} conversation The conversation to be updated
   * @param {Message} message The received message
   * @return {Conversation} The conversation with update properties
   */
  updateConversationContextFromMessage (conversation, message) {
    return conversation
  }

  /**
   * Parses an HTTP request sent to the channel's webhook and extracts a message object.
   * The returned message object needs to be in the bot connector's format.
   * @param {Conversation} conversation The message's conversation
   * @param {Object} message The raw message returned from {@link getRawMessage}
   * @param {Object} context Context from {@link populateMessageContext}
   * @return {Object} The well-formatted message object
   */
  parseIncomingMessage (conversation, message, context) { return noop() }

  /**
   * Parses an HTTP request sent to the channel's webhook and extracts a memory object.
   * The memory will be sent to the bot.
   * @param {Object} message The raw message returned from {@link getRawMessage}
   * @param {Object} context Context from {@link populateMessageContext}
   * @return {Object} The well-formatted message object
   */
  getMemoryOptions (message, context) { return { memory: {}, merge: true } }

  /**
   * Transforms a bot's response into a format that can be understood by the channel' API.
   * @param {Conversation} conversation The message's conversation
   * @param {Object} message Message in bot builder's format
   * @param {Object} context Context from {@link populateMessageContext}
   * @return {Object} Message in channel API's format
   */
  formatOutgoingMessage (conversation, message, context) { return message }

  /**
   * Sends response message to the channel.
   * @param {Conversation} conversation The message's conversation
   * @param {Object} message The pre-formatted message returned from {@link parseIncomingMessage}
   * @param {Object} context Context from {@link populateMessageContext}
   * @return {Promise} Promise which resolves when message was sent successfully
   */
  sendMessage (conversation, message, context) { return noop() }

  /**
   * Parses a participant's display name, which can be either a phone number or a user name.
   * @example
   * parseParticipantDisplayName (participant) {
   *   const externalParticipant = participant.data
   *   const displayName = `${externalParticipant.first} ${externalParticipant.last}`
   *   return { userName: displayName }
   * }
   * @example
   * parseParticipantDisplayName (participant) {
   *   const externalParticipant = participant.data
   *   return { phoneNumber: externalParticipant.mobile }
   * }
   * @param {Participant} participant Complete Participant object
   * saved in {@link populateParticipantData}
   * @return {Object} An object containing either a `phoneNumber` or a `userName` field
   */
  parseParticipantDisplayName (participant) {
    return ({})
  }

  /**
   * Downloads additional information about a participant and adds it to the database model.
   * The downloaded information can be an arbitrary object and is expected to be saved
   * as the `participant.data` property.
   * @example
   * const externalData = downloadParticipantFromAPI()
   * participant.data = externalData
   * participant.markModified('data')
   * // Persist model and return Promise
   * return participant.save()
   * @param {Participant} participant Participant model to be used for persisting the data
   * @param {Channel} channel An instance of the channel model
   * @return {Promise} Promise which resolves if data has been downloaded and saved successfully
   */
  populateParticipantData (participant, channel) {
    return participant
  }

  /* Call to send a message array
     to a bot. If this method returns
     true, `sendMessage` won't be called */
  sendMessages () {
    return false
  }

  /* Check shared webhook validity for certain channels (Messenger) */
  onSharedWebhookChecking () {
    throw new NotImplementedError('onSharedWebhookChecking')
  }

  /* Get unique model field / value pair to give a means to
     identify a channel when a message is received by
     a shared webhook endpoint */
  getIdPairsFromSharedWebhook () {
    throw new NotImplementedError('getIdPairsFromSharedWebhook')
  }

  /**
   * set a get started button to the appropriate channel
   * @param {Channel} an instance of the channel model
   * @param {Value} the get started button's value
   * @returns {Promise} a promise that resolves when the button is set
   */
  setGetStartedButton (channel, value, connector) {
    return noop()
  }

  /**
   * remove a get started button from a channel
   * @param {Channel} an instance of the channel model
   * @returns {Promise} a promise that resolves when the button is successfully removed
   */
  deleteGetStartedButton (channel) {
    return noop()
  }

  /**
   * Set a persistent menu to a specific channel
   * @param {Channel} An instance of the Channel model
   * @param {Menus} array of PersistentMenu instances
   * @returns {Promise} a promise that resolves when the persistent menu is successfully set
   */
  setPersistentMenu (channel, menus) {
    return noop()
  }

  /**
   * Remove a peristent menu form a specific channel
   * @param {Channel} An instance of the Channel model
   * @returns {Promise}
   */
  deletePersistentMenu (channel) {
    return noop()
  }
}

export default AbstractChannelIntegration
