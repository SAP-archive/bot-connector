import expect from 'expect.js'

import { fetchMethod } from '../tools'

import ParticipantsController from '../../src/controllers/participants'
import ParticipantsRoutes from '../../src/routes/participants'

describe('Participants Routes Testing', () => {

  describe('GET /connectors/:connectorId/participants', () => {
    it('should call ParticipantsController#getParticipantsByConnectorId', async () => {
      expect(fetchMethod(ParticipantsRoutes, 'GET', '/connectors/:connectorId/participants')).to.equal(ParticipantsController.index)
    })
  })

  describe('GET /connectors/:connectorId/participants/:participant_id', () => {
    it('should call ParticipantsController#getParticipantByConnectorId', async () => {
      expect(fetchMethod(ParticipantsRoutes, 'GET', '/connectors/:connectorId/participants/:participant_id')).to.equal(ParticipantsController.show)
    })
  })

})
