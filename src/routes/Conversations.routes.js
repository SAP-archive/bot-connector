export default [

  /**
  * @api {get} /conversations Get all Conversations of a Connector
  * @apiName getConversationsByConnectorId
  * @apiGroup Conversation
  *
  * @apiDescription List all the Conversations of a Connector
  *
  * @apiSuccess {Array} results Array of Conversations
  * @apiSuccess {String} results.id Conversation id
  * @apiSuccess {String} results.channel if of the Channel's Conversation
  * @apiSuccess {String} results.chatId id of the chat linked to the Conversation
  * @apiSuccess {String} results.connector ObjectId of the connector
  * @apiSuccess {String} results.isActive Conversation is active or not
  * @apiSuccess {String} message success message
  *
  * @apiError (Not Found 404) {String} message Bot not found
  */
  {
    method: 'GET',
    path: '/connectors/:connector_id/conversations',
    validators: [],
    handler: controllers.Conversations.getConversationsByConnectorId,
  },

  /**
  * @api {get} /conversation/:conversation_id Get Conversation
  * @apiName getConversationByConnectorId
  * @apiGroup Conversation
  *
  * @apiDescription Get a Conversation
  *
  * @apiParam {String} conversation_id Conversation id
  *
  * @apiSuccess {Object} results Conversation information
  * @apiSuccess {String} results.id Conversation id
  * @apiSuccess {String} results.channel Channel
  * @apiSuccess {String} results.connector Id of the connector
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
    path: '/connectors/:connector_id/conversations/:conversations_id',
    validators: [],
    handler: controllers.Conversations.getConversationByConnectorId,
  },
