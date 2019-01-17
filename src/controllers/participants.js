import { renderOk } from '../utils/responses'
import { NotFoundError } from '../utils/errors'
import { Connector, Conversation, Participant } from '../models'

export default class ParticipantController {

  static async index (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const conversationsIds = await Conversation
      .find({ connector: connector._id, isActive: true }, { _id: 1 })

    const participants = await Participant
      .find({ conversation: { $in: conversationsIds.map(c => c._id) } })

    return renderOk(res, {
      results: participants.map(p => p.serialize),
      message: participants.length ? 'Participants successfully rendered' : 'No participants',
    })
  }

  static async show (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    const participant_id = req.params.participant_id

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const participant = await Participant.findById(participant_id)
    if (!participant) {
      throw new NotFoundError('Participant')
    }

    const conversation = await Conversation
      .findOne({ _id: participant.conversation, isActive: true })
    if (!conversation || conversation.connector !== connector._id) {
      throw new NotFoundError('Participant')
    }

    return renderOk(res, {
      results: participant.serialize,
      message: 'Participant successfully rendered',
    })
  }

}
