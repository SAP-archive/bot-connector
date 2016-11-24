import ConversationController from '../controllers/Conversations.controller.js'
import * as conversationValidators from '../validators/Conversations.validators.js'

export default [

  /**
  * @api {get} /bots/:bot_id/conversations Get all Conversations of a Bot
  * @apiName getConversationsByBotId
  * @apiGroup Conversation
  *
  * @apiDescription List all the Conversations of a Bot
  *
  * @apiParam {String} bot_id Bot id
  *
  * @apiSuccess {Array} results Array of Conversations
  * @apiSuccess {String} results.id Conversation id
  * @apiSuccess {String} results.channel if of the Channel's Conversation
  * @apiSuccess {String} results.chatId id of the chat linked to the Conversation
  * @apiSuccess {String} results.bot ObjectId of the bot conversation
  * @apiSuccess {String} results.isActive Conversation is active or not
  * @apiSuccess {String} message success message
  *
  * @apiError (Bad Request 400) {String} message Return if bot_id is invalid
  *
  * @apiError (Not Found 404) {String} message Bot not found
  */
  {
    method: 'GET',
    path: '/bots/:bot_id/conversations',
    validators: [conversationValidators.getConversationsByBotId],
    handler: ConversationController.getConversationsByBotId,
  },

  /**
  * @api {get} /bots/:bot_id/conversation/:conversation_id Get Conversation
  * @apiName getConversationByBotId
  * @apiGroup Conversation
  *
  * @apiDescription Get a Conversation
  *
  * @apiParam {String} bot_id Bot id
  * @apiParam {String} conversation_id Conversation id
  *
  * @apiSuccess {Object} results Conversation information
  * @apiSuccess {String} results.id Conversation id
  * @apiSuccess {String} results.channel Channel
  * @apiSuccess {String} results.bot Id of the bot
  * @apiSuccess {String} results.chatId id of the chat linked to the Conversation
  * @apiSuccess {Boolean} results.isActive Conversation is active or not
  * @apiSuccess {Array} results.participants Array of Participants
  * @apiSuccess {Array} results.messages Array of Messages
  * @apiSuccess {String} message success message
  *
  * @apiError (Bad Request 400) {String} message Parameter conversation_id is invalid

  * @apiError (Not Found 404) {String} message Conversation not found
  */

  {
    method: 'GET',
    path: '/bots/:bot_id/conversations/:conversation_id',
    validators: [conversationValidators.getConversationByBotId],
    handler: ConversationController.getConversationByBotId,
  },

  /**
  * @api {delete} /bots/:bot_id/conversations/:conversation_id Delete conversation
  * @apiName deleteConversationByBotId
  * @apiGroup Conversation
  *
  * @apiDescription Delete a Bots's Conversation
  *
  * @apiParam {String} bot_id Bot id
  * @apiParam {String} conversation_id Conversation id
  *
  * @apiError (Bad Request 400) {String} message Parameter conversation_id is invalid
  *
  * @apiError (Not Found 404) {String} message Bot or Conversation not found
  */

  {
    method: 'DELETE',
    path: '/bots/:bot_id/conversations/:conversation_id',
    validators: [conversationValidators.deleteConversationByBotId],
    handler: ConversationController.deleteConversationByBotId,
  },
]
