import botController from '../controllers/Bots.controller.js'
import * as botValidators from '../validators/Bots.validators.js'

export default [

/**
* @api {GET} /bots/:bot_id Get a Bot
* @apiName getBotById
* @apiGroup Bot
*
* @apiDescription Get a Bot
*
* @apiParam {String} bot_id  Bot id
*
* @apiSuccess {Object} results Bot information
* @apiSuccess {String} results.id Bot id
* @apiSuccess {String} results.url Bot url
* @apiSuccess {Array} results.channels Array of Channels (see Channels)
* @apiSuccess {Array} results.conversations Array of Conversations (see Conversations)
* @apiSuccess {String} message success message
*
* @apiError (Bad Request 400 bot_id is invalid) {String} message Return if bot_id is invalid
*
* @apiError (Not found 404) {String} message Return if the bot doesn't exist
*/
  {
    method: 'GET',
    path: '/bots/:bot_id',
    validators: [botValidators.getBotById],
    handler: botController.getBotById,
  },

/**
* @api {GET} /bots/ Get list of Bots
* @apiName getBots
* @apiGroup Bot
*
* @apiDescription Get all the Bots
*
* @apiSuccess {Array} results Array of Bot
* @apiSuccess {String} results.id  Bot id
* @apiSuccess {String} results.url Bot url
* @apiSuccess {String} message success message
*/
  {
    method: 'GET',
    path: '/bots',
    validators: [],
    handler: botController.getBots,
  },

/**
* @api {POST} /bots Create a Bot
* @apiName createBot
* @apiGroup Bot
*
* @apiDescription Create a new bot
*
* @apiParam {String} url  Bot url endpoint
*
* @apiSuccess {Object} results Bot information
* @apiSuccess {String} results.id Bot id
* @apiSuccess {String} results.url Bot url
* @apiSuccess {Array} results.channels  Array of Bot's Channels (see Channels)
* @apiSuccess {Array} results.conversations Array of Bot's Conversations (see Conversations)
* @apiSuccess {String} message success message
*
* @apiError (Bad Request 400 url not valid) {String}message Return if url is invalid
*/
  {
    method: 'POST',
    path: '/bots',
    validators: [botValidators.createBot],
    handler: botController.createBot,
  },

/**
* @api {PUT} /bots/:bot_id Update a bot
* @apiName updateBotById
* @apiGroup Bot
*
* @apiDescription Update a bot
*
* @apiParam {String} bot_id  Bot id
* @apiParam {String} url Bot new url endpoint
*
* @apiSuccess {Object} results Bot information
* @apiSuccess {String} results.id Bot id
* @apiSuccess {String} results.url Bot url endpoint
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
    path: '/bots/:bot_id',
    validators: [botValidators.updateBotById],
    handler: botController.updateBotById,
  },

  /**
* @api {DELETE} /bots/:bot_id Delete a bot
* @apiName deleteBotById
* @apiGroup Bot
*
* @apiDescription Delete a bot
*
* @apiParam {String} bot_id Bot id
*
* @apiError (Bad Request 400 bot_id not valid) {String} message Return if bot_id is invalid
*
*/
  {
    method: 'DELETE',
    path: '/bots/:bot_id',
    validators: [botValidators.deleteBotById],
    handler: botController.deleteBotById,
  },
]
