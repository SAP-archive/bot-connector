import chai from 'chai'
import fetchMethod from '../services/fetchMethod.service'

import ParticipantsController from '../../src/controllers/Participants.controller'

describe("Routes", () => {
  it("GET /bots/:bot_id/participants", done => {
    chai.expect(fetchMethod('GET', '/bots/:bot_id/participants')).to.equal(ParticipantsController.getParticipantsByBotId)
    done()
  })

  it("GET /bots/:bot_id/participants/:participant_id", done => {
    chai.expect(fetchMethod('GET', '/bots/:bot_id/participants/:participant_id')).to.equal(ParticipantsController.getParticipantByBotId)
    done()
  })
})
