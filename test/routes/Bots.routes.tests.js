import chai from 'chai'
import fetchMethod from '../services/fetchMethod.service'

import config from '../../config/test'

import botController from '../../src/controllers/Bots.controller'

describe("Routes", () => {
  it("GET /bots/:bot_id", done => {
    chai.expect(fetchMethod('GET', '/bots/:bot_id')).to.equal(botController.getBotById)
    done()
  })

  it("GET /bots", done => {
    chai.expect(fetchMethod('GET', '/bots')).to.equal(botController.getBots)
    done()
  })

  it("POST /bots", done => {
    chai.expect(fetchMethod('POST', '/bots')).to.equal(botController.createBot)
    done()
  })

  it("PUT /bots/:bot_id", done => {
    chai.expect(fetchMethod('PUT', '/bots/:bot_id')).to.equal(botController.updateBotById)
    done()
  })
  it("DELETE /bots/:bot_id", done => {
    chai.expect(fetchMethod('DELETE', '/bots/:bot_id')).to.equal(botController.deleteBotById)
    done()
  })
})
