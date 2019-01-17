import expect from 'expect.js'

import { fetchMethod } from '../tools'

import MessagesController from '../../src/controllers/messages'
import MessagesRoutes from '../../src/routes/messages'

describe('Messages Routes', () => {

  describe('POST /connectors/:connectorId/conversations/:conversationId/messages', () => {
    it('should call MessagesController#postMessage', async () => {
      expect(
        fetchMethod(MessagesRoutes, 'POST', '/connectors/:connectorId/conversations/:conversationId/messages')
      ).to.equal(MessagesController.postMessage)
    })
  })

  describe('POST /connectors/:connectorId/messages', () => {
    it('should call MessagesController#postMessages', async () => {
      expect(
        fetchMethod(MessagesRoutes, 'POST', '/connectors/:connectorId/messages')
      ).to.equal(MessagesController.broadcastMessage)
    })
  })

})
