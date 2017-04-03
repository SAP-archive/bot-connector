import * as connectorValidators from '../validators/Connectors.validators.js'

export default [

/**
* @api {GET} /connectors/:bot_id Get a connector by botId
* @apiName getConnectorByBotId
* @apiGroup Connector
*
* @apiDescription Get a connector by botId
*
* @apiParam {String} bot_id  BotId
*
* @apiSuccess {Object} results Connector information
* @apiSuccess {String} results.id Connector id
* @apiSuccess {String} results.url Bot url
* @apiSuccess {String} results.botId BotId
* @apiSuccess {Array} results.channels Array of Channels (see Channels)
* @apiSuccess {Array} results.conversations Array of Conversations (see Conversations)
* @apiSuccess {String} message success message
*
* @apiError (Bad Request 400 bot_id is invalid) {String} message Return if bot_id is invalid
*
* @apiError (Not found 404) {String} message Return if the connector doesn't exist
*/
  {
    method: 'GET',
    path: '/connectors/:connector_id',
    validators: [],
    handler: controllers.Connectors.getConnectorByBotId,
  },

/**
* @api {POST} /bots Create a connector
* @apiName createConnector
* @apiGroup Connector
*
* @apiDescription Create a new connector
*
* @apiParam {String} url    Bot url endpoint
* @apiParam {String} botId  BotId (ref to bernard's bot)
*
* @apiSuccess {Object} results Connector information
* @apiSuccess {String} results.id Connector id
* @apiSuccess {String} results.url Bot url
* @apiSuccess {String} results.botId Bot id
* @apiSuccess {Array} results.channels  Array of Channels (see Channels)
* @apiSuccess {Array} results.conversations Array of Conversations (see Conversations)
* @apiSuccess {String} message success message
*
* @apiError (Bad Request 400 url not valid) {String} message Return if url is invalid
* @apiError (Bad Request 400 url not valid) {String} message Return if botId is invalid
*/
  {
    method: 'POST',
    path: '/connectors',
    validators: [connectorValidators.createConnector],
    handler: controllers.Connectors.createConnector,
  },

/**
* @api {PUT} /connectors/:bot_id Update a connector
* @apiName updateConnectorByBotId
* @apiGroup Connector
*
* @apiDescription Update a connector
*
* @apiParam {String} bot_id  Bot id
* @apiParam {String} url Bot new url endpoint
*
* @apiSuccess {Object} results Connector information
* @apiSuccess {String} results.id Connector id
* @apiSuccess {String} results.url Bot url endpoint
* @apiSuccess {String} results.botId Bot id
* @apiSuccess {Array} results.channels Array of Channels (see Channels)
* @apiSuccess {Array} results.conversations Array of Conversations (see Conversations)
* @apiSuccess {String} message success message
*
* @apiError (Bad Request 400 url not valid) {String} message Return if url is invalid
*
* @apiError (Bad Request 400 bot_id not valid) {String} message Return if bot_id is invalid
*
* @apiError (Not found 404) {String} message Return if the bot doesn't exist
*/
  {
    method: 'PUT',
    path: '/connectors/:connector_id',
    validators: [connectorValidators.updateConnectorByBotId],
    handler: controllers.Connectors.updateConnectorByBotId,
  },

  /**
* @api {DELETE} /connectors/:bot_id Delete a connector
* @apiName deleteConnectorByBotId
* @apiGroup Connector
*
* @apiDescription Delete a connector
*
* @apiParam {String} bot_id Bot id
*
* @apiError (Bad Request 400 bot_id not valid) {String} message Return if bot_id is invalid
*
*/
  {
    method: 'DELETE',
    path: '/connectors/:connector_id',
    validators: [],
    handler: controllers.Connectors.deleteConnectorByBotId,
  },
]
