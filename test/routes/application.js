import expect from 'expect.js'

import { fetchMethod } from '../tools'

import AppController from '../../src/controllers/application'
import AppRoutes from '../../src/routes/application'

describe('App routes', () => {

  describe('GET /', () => {
    it('should call AppController#index', async () => {
      expect(fetchMethod(AppRoutes, 'GET', '/')).to.equal(AppController.index)
    })
  })

  describe('POST /', () => {
    it('should call AppController#index', async () => {
      expect(fetchMethod(AppRoutes, 'POST', '/')).to.equal(AppController.index)
    })
  })

})

