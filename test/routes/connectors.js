import expect from 'expect.js'

import { fetchMethod } from '../tools'

import Connectors from '../../src/controllers/connectors'
import ConnectorsRoutes from '../../src/routes/connectors'

describe('Connectors Routes', () => {

  describe('GET /connectors/:bot_id', () => {
    it('should call ConnectorsController#show', async () => {
      expect(fetchMethod(ConnectorsRoutes, 'GET', '/connectors/:connectorId')).to.equal(Connectors.show)
    })
  })

  describe('POST /connectors', () => {
    it('should call ConnectorsController#create', async () => {
      expect(fetchMethod(ConnectorsRoutes, 'POST', '/connectors')).to.equal(Connectors.create)
    })
  })

  describe('PUT /connectors/:connectorId', () => {
    it('should call ConnectorsController#update', async () => {
      expect(
        fetchMethod(ConnectorsRoutes, 'PUT', '/connectors/:connectorId')
      ).to.equal(Connectors.update)
    })
  })

  describe('DELETE /connectors/:connectorId', () => {
    it('should call ConnectorsController#delete', async () => {
      expect(
        fetchMethod(ConnectorsRoutes, 'DELETE', '/connectors/:connectorId')
      ).to.equal(Connectors.delete)
    })
  })

})
