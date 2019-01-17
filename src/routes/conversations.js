import ConversationController from '../controllers/conversations'

export default [
  /**
  * @api {get} /connectors/:connectorId/conversations Get all Conversations of a Connector
  * @apiName getConversationsByConnectorId
  * @apiGroup Conversation
  * @apiVersion 1.0.0
  *
  * @apiDescription List all the Conversations of a Connector
  *
  * @apiParam {String} connectorId connector id
  *
  * @apiSuccess {Array} results Array of Conversations
  * @apiSuccess {String} results.id Conversation id
  * @apiSuccess {String} results.channel Id of the Channel the Conversation belongs to
  * @apiSuccess {String} results.chatId id of the chat linked to the Conversation
  * @apiSuccess {String} results.connector ObjectId of the connector
  * @apiSuccess {String} message success message
  *
  * @apiError (404 Not Found) {String} message Connector not found
  */
  {
    method: 'GET',
    path: ['/connectors/:connectorId/conversations'],
    validators: [],
    authenticators: [],
    handler: ConversationController.index,
  },

  /**
  * @api {get} /connectors/:connectorId/conversation/:conversation_id Get Conversation
  * @apiName getConversationByConnectorId
  * @apiGroup Conversation
  * @apiVersion 1.0.0
  *
  * @apiDescription Get a Conversation
  *
  * @apiParam {String} connectorId connector id
  * @apiParam {String} conversation_id Conversation id
  *
  * @apiSuccess {Object} results Conversation information
  * @apiSuccess {String} results.id Conversation id
  * @apiSuccess {String} results.channel Channel
  * @apiSuccess {String} results.connector Id of the connector
  * @apiSuccess {String} results.chatId id of the chat linked to the Conversation
  * @apiSuccess {Array} results.participants Array of Participants
  * @apiSuccess {Array} results.messages Array of Messages
  * @apiSuccess {String} message success message
  *
  * @apiError (400 Bad Request) {String} message Parameter conversation_id is invalid
  * @apiError (404 Not Found) {String} message Conversation not found
  */
  {
    method: 'GET',
    path: ['/connectors/:connectorId/conversations/:conversation_id'],
    validators: [],
    authenticators: [],
    handler: ConversationController.show,
  },

  /**
  * @api {delete} /connectors/:connectorId/conversations/:conversation_id Delete conversation
  * @apiName deleteConversationByConnectorId
  * @apiGroup Conversation
  *
  * @apiDescription Delete a Connector's Conversation
  *
  * @apiParam {String} connectorId connector id
  * @apiParam {String} conversation_id Conversation id
  *
  * @apiError (400 Bad Request) {String} message Parameter conversation_id is invalid
  * @apiError (404 Not Found) {String} message Connector or Conversation not found
  */
  {
    method: 'DELETE',
    path: ['/connectors/:connectorId/conversations/:conversation_id'],
    validators: [],
    authenticators: [],
    handler: ConversationController.delete,
  },

  {
    method: 'POST',
    path: ['/connectors/:connectorId/conversations/dump'],
    validators: [],
    authenticators: [],
    handler: ConversationController.dumpDelete,
  },
]
