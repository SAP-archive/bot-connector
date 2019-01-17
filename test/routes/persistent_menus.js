import expect from 'expect.js'

import { fetchMethod } from '../tools'

import PersistentMenuController from '../../src/controllers/persistent_menus'
import PersistentMenusRoutes from '../../src/routes/persistent_menus'

describe('Persistent Menu Routes', () => {

  describe('GET /connectors/:connectorId/persistentmenus', () => {
    it('should call PersistentMenuController#index', async () => {
      expect(fetchMethod(PersistentMenusRoutes, 'GET', '/connectors/:connectorId/persistentmenus')).to.equal(PersistentMenuController.index)
    })
  })

  describe('GET /connectors/:connectorId/persistentmenus/:language', () => {
    it('should call PersistentMenuController#show', async () => {
      expect(fetchMethod(PersistentMenusRoutes, 'GET', '/connectors/:connectorId/persistentmenus/:language')).to.equal(PersistentMenuController.show)
    })
  })

  describe('POST /connectors/:connectorId/persistentmenus', () => {
    it('should call PersistentMenuController#create', async () => {
      expect(fetchMethod(PersistentMenusRoutes, 'POST', '/connectors/:connectorId/persistentmenus')).to.equal(PersistentMenuController.create)
    })
  })

  describe('POST /connectors/:connectorId/persistentmenus/setDefault', () => {
    it('should call PersistentMenuController#setdefault', async () => {
      expect(fetchMethod(PersistentMenusRoutes, 'POST', '/connectors/:connectorId/persistentmenus/setdefault')).to.equal(PersistentMenuController.setDefault)
    })
  })

  describe('DELETE /connectors/:connectorId/persistentmenus', () => {
    it('should call PersistentMenuController#deleteAll', async () => {
      expect(fetchMethod(PersistentMenusRoutes, 'DELETE', '/connectors/:connectorId/persistentmenus')).to.equal(PersistentMenuController.deleteAll)
    })
  })

  describe('DELETE /connectors/:connectorId/persistentmenus/:language', () => {
    it('should call PersistentMenuController#delete', async () => {
      expect(fetchMethod(PersistentMenusRoutes, 'DELETE', '/connectors/:connectorId/persistentmenus/:language')).to.equal(PersistentMenuController.delete)
    })
  })

  describe('PUT /connectors/:connectorId/persistentmenus/:language', () => {
    it('should call PersistentMenuController#update', async () => {
      expect(fetchMethod(PersistentMenusRoutes, 'PUT', '/connectors/:connectorId/persistentmenus/:language')).to.equal(PersistentMenuController.update)
    })
  })
})
