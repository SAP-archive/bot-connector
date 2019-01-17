import expect from 'expect.js'

import { fetchMethod } from '../tools'

import ConversationsController from '../../src/controllers/conversations'
import ConversationsRoutes from '../../src/routes/conversations'

describe('Conversations Routes', () => {

  describe('GET /conversations', () => {
    it('should call ConversationsController#index', async () => {
      expect(
        fetchMethod(ConversationsRoutes, 'GET', '/connectors/:connectorId/conversations')
      ).to.equal(ConversationsController.index)
    })
  })

  describe('GET /conversations/:conversation_id', () => {
    it('should call ConversationsController#show', async () => {
      expect(
        fetchMethod(ConversationsRoutes, 'GET', '/connectors/:connectorId/conversations/:conversation_id')
      ).to.equal(ConversationsController.show)
    })
  })

  describe('DELETE /conversations/:conversation_id', () => {
    it('should call ConversationsController#delete', async () => {
      expect(
        fetchMethod(ConversationsRoutes, 'DELETE', '/connectors/:connectorId/conversations/:conversation_id')
      ).to.equal(ConversationsController.delete)
    })
  })

  describe('POST /conversations/dump', () => {
    it('should call ConversationsController#dumpDelete', async () => {
      expect(
        fetchMethod(ConversationsRoutes, 'POST', '/connectors/:connectorId/conversations/dump')
      ).to.equal(ConversationsController.dumpDelete)
    })
  })

})
