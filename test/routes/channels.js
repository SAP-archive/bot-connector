import expect from 'expect.js'

import { fetchMethod } from '../tools'

import ChannelsController from '../../src/controllers/channels'
import ChannelsRoutes from '../../src/routes/channels'

describe('Channels Routes', () => {

  describe('POST /channels', () => {
    it('should call ChannelsController#create', async () => {
      expect(fetchMethod(ChannelsRoutes, 'POST', '/connectors/:connectorId/channels')).to.equal(ChannelsController.create)
    })
  })

  describe('GET /channels', () => {
    it('should call ChannelsController#index', async () => {
      expect(fetchMethod(ChannelsRoutes, 'GET', '/connectors/:connectorId/channels')).to.equal(ChannelsController.index)
    })
  })

  describe('GET /channels/:channel_slug', () => {
    it('should call ChannelsController#show', async () => {
      expect(
        fetchMethod(ChannelsRoutes, 'GET', '/connectors/:connectorId/channels/:channel_slug')
      ).to.equal(ChannelsController.show)
    })
  })

  describe('PUT /channels/:channel_slug', () => {
    it('should call ChannelsController#update', async () => {
      expect(
        fetchMethod(ChannelsRoutes, 'PUT', '/connectors/:connectorId/channels/:channel_slug')
      ).to.equal(ChannelsController.update)
    })
  })

  describe('DELETE /channels/:channel_slug', () => {
    it('should call ChannelsController#delete', async () => {
      expect(
        fetchMethod(ChannelsRoutes, 'DELETE', '/connectors/:connectorId/channels/:channel_slug')
      ).to.equal(ChannelsController.delete)
    })
  })

})
