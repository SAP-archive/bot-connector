import * as connectorValidators from '../validators/connectors'
import Connectors from '../controllers/connectors'

export default [
  /**
  * @api {GET} /connectors/:connectorId Get a connector by Id
  * @apiName getConnectorById
  * @apiGroup Connector
  * @apiVersion 1.0.0
  *
  * @apiDescription Get a connector by Id
  *
  * @apiParam {String} connectorId connector id
  *
  * @apiSuccess {Object} results Connector information
  * @apiSuccess {String} results.id Connector Id
  * @apiSuccess {String} results.url Bot URL
  * @apiSuccess {Boolean} results.isTyping if true, the bot is shown as typing while processing a response
  * @apiSuccess {Array} results.channels Array of Channels (see Channels)
  * @apiSuccess {Array} results.conversations Array of Conversations (see Conversations)
  * @apiSuccess {String} message success message
  *
  * @apiError (404 Not Found) {String} message if the connector doesn't exist
  * @apiError (404 Not Found) {String} results
  */
  {
    method: 'GET',
    path: ['/connectors/:connectorId'],
    validators: [],
    authenticators: [],
    handler: Connectors.show,
  },

  /**
  * @api {POST} /connectors Create a connector
  * @apiName createConnector
  * @apiGroup Connector
  * @apiVersion 1.0.0
  *
  * @apiDescription Create a new connector
  *
  * @apiParam {String} url    Bot URL endpoint
  * @apiParam {Boolean} [isTyping=true] if true, the bot will be shown as typing while processing a response
  *
  * @apiSuccess {Object} results Connector information
  * @apiSuccess {String} results.id Connector id
  * @apiSuccess {String} results.url Bot url
  * @apiSuccess {Boolean} results.isTyping if true, the bot is shown as typing while processing a response
  * @apiSuccess {Array} results.channels  Array of Channels (see Channels)
  * @apiSuccess {Array} results.conversations Array of Conversations (see Conversations)
  * @apiSuccess {String} message success message
  *
  * @apiError (400 Bad Request - url parameter missing) {String} message "Parameter url is missing"
  * @apiError (400 Bad Request - url parameter missing) {null} results
  */
  {
    method: 'POST',
    path: ['/connectors'],
    validators: [connectorValidators.createConnector],
    authenticators: [],
    handler: Connectors.create,
  },

  /**
  * @api {PUT} /connectors/:connectorId Update a connector
  * @apiName updateConnectorById
  * @apiGroup Connector
  * @apiVersion 1.0.0
  *
  * @apiDescription Update a connector
  *
  * @apiParam {String} connectorId  connector id
  * @apiParam {String} [url] Bot URL endpoint
  * @apiParam {Boolean} [isTyping] if true, the bot will be shown as typing while processing a response.
  *
  * @apiSuccess {Object} results Connector information
  * @apiSuccess {String} results.id Connector id
  * @apiSuccess {String} results.url Bot url endpoint
  * @apiSuccess {Array} results.channels Array of Channels (see Channels)
  * @apiSuccess {Array} results.conversations Array of Conversations (see Conversations)
  * @apiSuccess {String} message success message
  *
  * @apiError (400 Bad Request - url not valid) {String} message Return if url is invalid
  *
  * @apiError (404 Not Found) {String} message "Connector not found"
  */
  {
    method: 'PUT',
    path: ['/connectors/:connectorId'],
    validators: [connectorValidators.updateConnector],
    authenticators: [],
    handler: Connectors.update,
  },

  /**
  * @api {DELETE} /connectors/:connectorId Delete a connector
  * @apiName deleteConnectorById
  * @apiGroup Connector
  * @apiVersion 1.0.0
  *
  * @apiDescription Delete a connector
  *
  * @apiParam {String} connectorId connector id
  *
  * @apiSuccess (200 OK) {String} message "Connector successfully deleted"
  * @apiSuccess (200 OK) {null} results
  *
  * @apiError (404 Not Found) {String} message "Connector not found"
  * @apiError (404 Not Found) {null} results
  *
  */
  {
    method: 'DELETE',
    path: ['/connectors/:connectorId'],
    validators: [],
    authenticators: [],
    handler: Connectors.delete,
  },
]
