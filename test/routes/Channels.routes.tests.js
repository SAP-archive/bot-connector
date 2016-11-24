import chai from 'chai'
import fetchMethod from '../services/fetchMethod.service'
import config from '../../config/test'
import channelController from '../../src/controllers/Channels.controller'

describe("Routes", () => {
  it("POST /bots/:bot_id/channels", done => {
    chai.expect(fetchMethod('POST', '/bots/:bot_id/channels')).to.equal(channelController.createChannelByBotId)
    done()
  })
  it("GET /bots/:bot_id/channels", done => {
    chai.expect(fetchMethod('GET', '/bots/:bot_id/channels')).to.equal(channelController.getChannelsByBotId)
    done()
  })
  it("GET /bots/:bot_id/channels/:channel_slug", done => {
    chai.expect(fetchMethod('GET', '/bots/:bot_id/channels/:channel_slug')).to.equal(channelController.getChannelByBotId)
    done()
  })
  it("PUT /bots/:bot_id/channels/:channel_slug", done => {
    chai.expect(fetchMethod('PUT', '/bots/:bot_id/channels/:channel_slug')).to.equal(channelController.updateChannelByBotId)
    done()
  })
  it("DELETE /bots/:bot_id/channels/:channel_slug", done => {
    chai.expect(fetchMethod('DELETE', '/bots/:bot_id/channels/:channel_slug')).to.equal(channelController.deleteChannelByBotId)
    done()
  })
})
