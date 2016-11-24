import ParticipantController from '../controllers/Participants.controller'
import * as participantsValidators from '../validators/Participants.validators.js'

export default [
  /**
  * @api {get} /bots/:bot_id/participants Index Bot's Participants
  * @apiName List participants
  * @apiGroup Participants
  *
  * @apiDescription Index bot participants (for all conversations and all channels)
  *
  * @apiParam (Route Parameters) {ObjectId} bot_id Bot id
  *
  * @apiSuccess (Success 200 with at least one participant) {Array} results Array of participants
  * @apiSuccess (Success 200 with at least one participant) {ObjectId} results.id Participant objectId
  * @apiSuccess (Success 200 with at least one participant) {String} results.name Participant name
  * @apiSuccess (Success 200 with at least one participant) {String} results.slug Participant slug
  * @apiSuccess (Success 200 with at least one participant) {Object} results.information Particpant information
  * @apiSuccess (Success 200 with at least one participant) {Boolean} results.isBot Is this particpant a bot ?
  * @apiSuccess (Success 200 with at least one participant) {String} message Participants successfully rendered
  *
  *
  * @apiSuccess (Success 200 with no participant) {null} results Response data
  * @apiSuccess (Success 200 with no participant) {String} message No participants
  *
  * @apiError (Bad Request 400) {String} message Parameter bot_id is invalid
  */
  {
    method: 'GET',
    path: '/bots/:bot_id/participants',
    validators: [participantsValidators.getParticipantsByBotId],
    handler: ParticipantController.getParticipantsByBotId,
  },

  /**
  * @api {get} /bots/:bot_id/participants/:participant_id Show bot a specific participant (for a bot)
  * @apiName Show participant
  * @apiGroup Participants
  *
  * @apiDescription Show bot a specific participant (for a bot)
  *
  * @apiParam (Route Parameters) {ObjectId} bot_id Bot ObjectId
  * @apiParam (Route Parameters) {ObjectId} participant_id Participant ObjectId
  *
  * @apiSuccess (Success 200) {Participant} results Participant
  * @apiSuccess (Success 200) {ObjectId} results.id Participant objectId
  * @apiSuccess (Success 200) {String} results.name Participant name
  * @apiSuccess (Success 200) {String} results.slug Participant slug
  * @apiSuccess (Success 200) {Object} results.information Particpant information
  * @apiSuccess (Success 200) {Boolean} results.isBot Is this particpant a bot ?
  * @apiSuccess (Success 200) {String} message Participant successfully rendered
  *
  * @apiError (Bad Request 400 for bot_id) {null} results Response data
  * @apiError (Bad Request 400 for bot_id) {String} message Parameter bot_id is invalid
  *
  * @apiError (Bad Request 400 for participant_id) {String} message Parameter participant_id is invalid
  */
  {
    method: 'GET',
    path: '/bots/:bot_id/participants/:participant_id',
    validators: [participantsValidators.getParticipantByBotId],
    handler: ParticipantController.getParticipantByBotId,
  },
]
