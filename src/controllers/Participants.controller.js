import { NotFoundError } from '../utils/errors'
import { renderOk } from '../utils/responses'

export default class ParticipantController {

  /*
  * Index all connector's participants
  */
  static async getParticipantsByConnectorId (req, res) {
    const { connector_id } = req.params
    const results = []

    const conversations = await models.Conversation.find({ connector: connector_id }).populate('participants')

    conversations.forEach(c => {
      c.participants.forEach(p => results.push(p.serialize))
    })

    return renderOk(res, {
      results,
      messages: results.length ? 'Participants successfully rendered' : 'No participants',
    })
  }

  /*
  * Show a participant
  */
  static async getParticipantByConnectorId (req, res) {
    const { participant_id } = req.params

    const participant = await models.Participant.findById(participant_id)

    if (!participant) { throw new NotFoundError('Participant') }

    return renderOk(res, {
      results: participant.serialize,
      message: 'Participant successfully rendered',
    })
  }
}
