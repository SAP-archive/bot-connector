import { notFoundError, handleMongooseError } from '../utils/errors'

export default class ParticipantController {

  /*
  * Index all bot's participants
  */
  static getParticipantsByBotId (req, res) {

    Conversation.find({ bot: req.params.bot_id })
      .populate('participants')
      .exec()
      .then(conversations => {
        const results = []

        conversations.forEach(c => {
          c.participants.forEach(p => results.push(p.serialize))
        })

        const message = results.length ? 'Participants successfully rendered' : 'No participants'
        res.json({ results, message })
      })
      .catch(err => handleMongooseError(err, res, 'participants'))
  }

  /*
  * Show a participant
  */
  static getParticipantByBotId (req, res) {
    Conversation.find({ bot: req.params.bot_id })
      .populate('participants')
      .exec()
      .then(conversations => {
        let participant = null

        conversations.forEach(c => {
          c.participants.forEach(p => {
            if (p._id.toString() === req.params.participant_id.toString()) {
              participant = p.serialize
            }
          })
        })
        if (!participant) { return Promise.reject(new notFoundError('Participant')) }
        res.json({ results: participant, message: 'Participant successfully rendered' })

      })
      .catch(err => handleMongooseError(err, res, 'Error while getting participant'))
  }
}
