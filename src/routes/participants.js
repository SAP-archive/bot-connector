import ParticipantController from '../controllers/participants'

export default [
  /**
  * @api {get} /connectors/:connectorId/participants Index Connector's Participants
  * @apiName List participants
  * @apiGroup Participants
  *
  * @apiDescription List all connector participants (for all conversations and all channels)
  *
  * @apiSuccess (Success 200 with at least one participant) {Array} results Array of participants
  * @apiSuccess (Success 200 with at least one participant) {ObjectId} results.id Participant objectId
  * @apiSuccess (Success 200 with at least one participant) {String} results.name Participant name
  * @apiSuccess (Success 200 with at least one participant) {String} results.slug Participant slug
  * @apiSuccess (Success 200 with at least one participant) {Object} results.information Particpant information
  * @apiSuccess (Success 200 with at least one participant) {Boolean} results.isBot Is this particpant a bot?
  * @apiSuccess (Success 200 with at least one participant) {String} message Participants successfully rendered
  *
  * @apiSuccess (Success 200 with no participant) {null} results Response data
  * @apiSuccess (Success 200 with no participant) {String} message No participants
  */
  {
    method: 'GET',
    path: ['/connectors/:connectorId/participants'],
    validators: [],
    authenticators: [],
    handler: ParticipantController.index,
  },

  /**
  * @api {get} /connectors/:connectorId/participants/:participant_id Show a specific participant (for a connector)
  * @apiName Show participant
  * @apiGroup Participants
  *
  * @apiDescription Show a specific participant (for a connector)
  *
  * @apiParam (Route Parameters) {ObjectId} participant_id Participant ObjectId
  *
  * @apiSuccess (Success 200) {Participant} results Participant
  * @apiSuccess (Success 200) {ObjectId} results.id Participant objectId
  * @apiSuccess (Success 200) {String} results.name Participant name
  * @apiSuccess (Success 200) {String} results.slug Participant slug
  * @apiSuccess (Success 200) {Object} results.information Particpant information
  * @apiSuccess (Success 200) {Boolean} results.isBot Is this particpant a bot?
  * @apiSuccess (Success 200) {String} message Participant successfully rendered
  *
  * @apiError (Bad Request 400 for participant_id) {String} message Parameter participant_id is invalid
  */
  {
    method: 'GET',
    path: ['/connectors/:connectorId/participants/:participant_id'],
    validators: [],
    authenticators: [],
    handler: ParticipantController.show,
  },
]
