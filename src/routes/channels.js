import * as channelValidators from '../validators/channels'
import ChannelController from '../controllers/channels'

export default [

  /**
  * @api {post} /connectors/:connectorId/channels Create a Channel
  * @apiName createChannelByConnectorId
  * @apiGroup Channel
  * @apiVersion 1.0.0
  *
  * @apiDescription Creates a channel only with parameters provided.
  *
  * @apiParam {String} connectorId Connector id
  * @apiParam {String} slug Channel slug
  * @apiParam {String} type Channel type
  * @apiParam {String} [token] Channel token (Messenger and Slack)
  * @apiParam {String} [userName] Channel username (Kik)
  * @apiParam {String} [apiKey] Channel apiKey (Kik and Messenger)
  * @apiParam {String} [clientId]
  * @apiParam {String} [clientSecret]
  * @apiParam {Boolean} isActivated Channel isActivated
  *
  * @apiSuccess {Object} results Channel information
  * @apiSuccess {String} results.slug Channel slug
  * @apiSuccess {String} results.type Channel type
  * @apiSuccess {String} [results.token] Channel token, only present if a token has been set
  * @apiSuccess {String} [results.userName] Channel userName, only present if a username has been set
  * @apiSuccess {String} [results.apiKey] Channel apiKey, only present if an api key has been set
  * @apiSuccess {String} [clientId]
  * @apiSuccess {String} [clientSecret]
  * @apiSuccess {String} results.webhook Channel webhook
  * @apiSuccess {Boolean} results.isActivated Channel isActivated
  * @apiSuccess {String} message success message
  *
  * @apiError (400 Bad Request - type not valid) {String} message Returned if type is invalid
  *
  * @apiError (400 Bad Request - isActivated not valid) {String} message Return if isActivated is invalid
  *
  * @apiError (400 Bad Request - slug missing) {String} message "Parameter slug is missing"
  *
  * @apiError (409 Conflict - slug already taken) {String} message Returned if slug is already taken in the current Connector scope
  * @apiError (409 Conflict - slug already taken) {null} results null
  */
  {
    method: 'POST',
    path: ['/connectors/:connectorId/channels'],
    validators: [channelValidators.createChannelByConnectorId],
    authenticators: [],
    handler: ChannelController.create,
  },

  /**
  * @api {get} /connectors/:connectorId/channels Get Channels
  * @apiName getChannelsByConnectorId
  * @apiGroup Channel
  * @apiVersion 1.0.0
  *
  * @apiDescription Get all Channels of a Connector
  *
  * @apiParam {String} connectorId Connector id
  *
  * @apiSuccess {Array} results Array of Channels
  * @apiSuccess {String} results.connector Connector object
  * @apiSuccess {String} results.slug Channel slug
  * @apiSuccess {String} results.type Channel type
  * @apiSuccess {String} [results.token] Channel token
  * @apiSuccess {String} [results.userName] Channel userName
  * @apiSuccess {String} [results.apiKey] Channel apiKey
  * @apiSuccess {String} [results.clientId] clientId of the channel
  * @apiSuccess {String} [results.clientSecret] clientSecret of the channel
  * @apiSuccess {String} results.webhook Channel webhook
  * @apiSuccess {Boolean} results.isActivated if false, incoming messages won't be forwarded to the bot
  * @apiSuccess {String} message success message
  *
  * @apiError (404 Not Found) {String} message "Connector not found"
  * @apiError (404 Not Found) {null} results null
  */
  {
    method: 'GET',
    path: ['/connectors/:connectorId/channels'],
    validators: [],
    authenticators: [],
    handler: ChannelController.index,
  },

  /**
  * @api {get} /connectors/:connectorId/channels/:channel_slug Get a Channel
  * @apiName getChannelByConnectorId
  * @apiGroup Channel
  * @apiVersion 1.0.0
  *
  * @apiDescription Get a Channel of a Connector
  *
  * @apiParam {String} channel_slug Channel slug.
  *
  * @apiSuccess {Object} results Channel information
  * @apiSuccess {String} results.channel_slug Channel slug.
  * @apiSuccess {String} results.connector Connector object.
  * @apiSuccess {String} results.slug Channel slug.
  * @apiSuccess {String} results.type Channel type.
  * @apiSuccess {String} [results.token] Channel token.
  * @apiSuccess {String} [results.userName] Channel userName.
  * @apiSuccess {String} [results.apiKey] Channel apiKey.
  * @apiSuccess {String} [results.clientId] clientId of the channel
  * @apiSuccess {String} [results.clientSecret] clientSecret of the channel
  * @apiSuccess {String} results.webhook Channel webhook.
  * @apiSuccess {Boolean} results.isActivated Channel isActivated.
  * @apiSuccess {String} message success message
  *
  * @apiError (400 Bad Request - connectorId not valid) {String} message Return if connectorId is invalid
  *
  * @apiError (400 Bad Request - channel_slug not valid) {String} message Return if channel_slug is invalid
  *
  * @apiError (404 Not Found) {String} message Return if either the Connector or the Channel doesn't exist
  */
  {
    method: 'GET',
    path: ['/connectors/:connectorId/channels/:channel_slug'],
    validators: [],
    authenticators: [],
    handler: ChannelController.show,
  },

  /**
  * @api {put} /connectors/:connectorId/channels/:channel_slug Update a Channel
  * @apiName updateChannelByConnectorId
  * @apiGroup Channel
  * @apiVersion 1.0.0
  *
  * @apiDescription Update a Channel
  *
  * @apiParam {String} channel_slug Channel slug.
  * @apiParam {String} slug Channel slug
  * @apiParam {String} type Channel type
  * @apiParam {String} [token] Channel token (Messenger and Slack)
  * @apiParam {String} [userName] Channel username (Kik)
  * @apiParam {String} [apiKey] Channel apiKey (Kik and Messenger)
  * @apiParam {String} [clientId] clientId of the channel
  * @apiParam {String} [clientSecret] clientSecret of the channel
  * @apiParam {String} [webhook] Channel webhook
  * @apiParam {Boolean} isActivated Channel isActivated
  *
  * @apiSuccess {Object} results Channel information
  * @apiSuccess {String} results.channel_slug Channel slug.
  * @apiSuccess {String} results.bot Connector object.
  * @apiSuccess {String} results.slug Channel slug.
  * @apiSuccess {String} results.type Channel type.
  * @apiSuccess {String} [results.token] Channel token.
  * @apiSuccess {String} [results.userName] Channel userName.
  * @apiSuccess {String} [results.apiKey] Channel apiKey.
  * @apiSuccess {String} [results.clientId] clientId of the channel
  * @apiSuccess {String} [results.clientSecret] clientSecret of the channel
  * @apiSuccess {String} results.webhook Channel webhook.
  * @apiSuccess {Boolean} results.isActivated Channel isActivated.
  * @apiSuccess {String} message success message
  *
  * @apiError (400 Bad Request - connectorId not valid) {String} message Returned if connectorId is invalid
  *
  * @apiError (400 Bad Request - channel_slug not valid) {String} message Returned if channel_slug is invalid
  *
  * @apiError (400 Bad Request) channel_slug invalid The channel slug is empty or missing
  *
  * @apiError (400 Bad Request) connectorId not valid
  *
  * @apiError (404 Not Found - Connector or Channel not found) {String} message indicates whether the Connector or the Channel doesn't exist
  *
  * @apiError (409 Conflict - slug already taken) {String} message Returned if slug is already taken
  */
  {
    method: 'PUT',
    path: ['/connectors/:connectorId/channels/:channel_slug'],
    validators: [channelValidators.updateChannel],
    authenticators: [],
    handler: ChannelController.update,
  },

  /**
  * @api {delete} /connectors/:connectorId/channels/:channel_slug Delete a Channel
  * @apiName deleteChannelByConnectorId
  * @apiGroup Channel
  * @apiVersion 1.0.0
  *
  * @apiDescription Delete a Channel
  *
  * @apiParam {String} channel_slug Slug of the Channel to be deleted
  *
  * @apiError (404 Not Found) {String} message Returned if either the Connector or the Channel doesn't exist
  */
  {
    method: 'DELETE',
    path: ['/connectors/:connectorId/channels/:channel_slug'],
    validators: [],
    authenticators: [],
    handler: ChannelController.delete,
  },
]
