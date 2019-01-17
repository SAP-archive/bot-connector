import expect from 'expect.js'

import { fetchMethod } from '../tools'

import WebhookController from '../../src/controllers/webhooks'
import WebhooksRoutes from '../../src/routes/webhooks'

describe('Webhooks Routes', () => {

  describe('POST /webhook/:channel_id', () => {
    it('should call WebhooksController#handleMethodAction', async () => {
      expect(fetchMethod(WebhooksRoutes, 'POST', '/webhook/:channel_id')).to.equal(WebhookController.handleMethodAction)
    })
  })

  describe('GET /webhook/:channel_id', () => {
    it('should call WebhooksController#handleMethodAction', async () => {
      expect(fetchMethod(WebhooksRoutes, 'GET', '/webhook/:channel_id')).to.equal(WebhookController.handleMethodAction)
    })
  })

  describe('POST /webhook/:channel_id/conversations', () => {
    it('should call WebhooksController#createConversation', async () => {
      expect(fetchMethod(WebhooksRoutes, 'POST', '/webhook/:channel_id/conversations')).to.equal(WebhookController.createConversation)
    })
  })

  describe('GET /webhook/:channel_id/conversations/:conversation_id/messages', () => {
    it('should call WebhooksController#getMessages', async () => {
      expect(fetchMethod(WebhooksRoutes, 'GET', '/webhook/:channel_id/conversations/:conversation_id/messages')).to.equal(WebhookController.getMessages)
    })
  })

  describe('GET /webhook/:channel_id/conversations/:conversation_id/poll', () => {
    it('should call WebhooksController#poll', async () => {
      expect(fetchMethod(WebhooksRoutes, 'GET', '/webhook/:channel_id/conversations/:conversation_id/poll')).to.equal(WebhookController.poll)
    })
  })

  describe('GET /webhook/:channel_id/preferences', () => {
    it('should call WebhooksController#preferences', async () => {
      expect(fetchMethod(WebhooksRoutes, 'GET', '/webhook/:channel_id/preferences')).to.equal(WebhookController.getPreferences)
    })
  })

})
