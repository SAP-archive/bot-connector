import chai from 'chai'
import chaiHttp from 'chai-http'
import mongoose from 'mongoose'

import Bot from '../../src/models/Bot.model'
import Channel from '../../src/models/Channel.model'

const assert = require('chai').assert
const expect = chai.expect
const should = chai.should()

chai.use(chaiHttp)

const url = 'https://test.com'
const baseUrl = 'http://localhost:8080'
const payload = {
  type: 'slack',
  isActivated: true,
  slug: 'test',
}

describe('Channel validator', () => {
  describe('createChannelByBotId', () => {
    let bot = {}
    before(async () => bot = await new Bot({ url }))
    after(async () => await Bot.remove({}))

    it ('should be a 400 with an invalid bot_id', async () => {
      try {
        await chai.request(baseUrl).post('/bots/1234/channels').send()
        should.fail()
      } catch (err) {
        const res = err.response

        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'Parameter bot_id is invalid')
      }
    })

    it('should be a 400 with a missing type', async () => {
      const payload = { isActivated: true, slug: 'slug-test' }
      try {
        await chai.request(baseUrl).post(`/bots/${bot._id}/channels`).send(payload)
        should.fail()
      } catch (err) {
        const res = err.response

        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'Parameter type is missing')
      }
    })

    it ('should be a 400 with an invalid type', async () => {
      const payload = { type: 'invalid', isActivated: true, slug: 'slug-test' }
      try {
        await chai.request(baseUrl).post(`/bots/${bot._id}/channels`).send(payload)
        should.fail()
      } catch (err) {
        const res = err.response

        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'Parameter type is invalid')
      }
    })

    it ('should be a 400 with a missing isActivated', async () => {
      const payload = { type: 'slack', slug: 'slug-test' }
      try {
        await chai.request(baseUrl).post(`/bots/${bot._id}/channels`).send(payload)
        should.fail()
      } catch (err) {
        const res = err.response

        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'Parameter isActivated is missing')
      }
    })

    it ('should be a 400 with a missing slug', async () => {
      const payload = { type: 'slack', isActivated: true }
      try {
        await chai.request(baseUrl).post(`/bots/${bot._id}/channels`).send(payload)
        should.fail()
      } catch (err) {
        const res = err.response

        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'Parameter slug is missing')
      }
    })

  })

  describe('getChannelsByBotId', () => {
    it ('should be a 400 with an invalid bot_id', async () => {
      try {
        await chai.request(baseUrl).get('/bots/1234/channels').send()
        should.fail()
      } catch (err) {
        const res = err.response

        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'Parameter bot_id is invalid')
      }
    })
  })

  describe('getChannelByBotId', () => {
    let bot = {}
    before(async () => bot = await new Bot({ url }).save())
    after(async () => Bot.remove({}))

    it ('should be a 400 with an invalid bot_id', async () => {
      try {
        await chai.request(baseUrl).get('/bots/1234/channels/1234').send()
        should.fail()
      } catch (err) {
        const res = err.response

        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'Parameter bot_id is invalid')
      }
    })
  })

  describe('updateChannelByBotId', () => {
    let bot = {}
    let channel = {}
    before(async () => {
      bot = await new Bot({ url }).save()
      channel = await new Channel({ ...payload, bot: bot._id }).save()
    })
    after(async () => Promise.all([Bot.remove({}), Channel.remove({})]))

    it ('should be a 400 with an invalid bot_id', async () => {
      try {
        await chai.request(baseUrl).put(`/bots/1234/channels/${channel._slug}`).send()
        should.fail()
      } catch (err) {
        const res = err.response

        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'Parameter bot_id is invalid')
      }
    })

    it ('should be a 409 with an invalid bot_id', async () => {
      try {
        await new Channel({ ...payload, slug: 'test1', bot: bot._id }).save()
        await chai.request(baseUrl).put(`/bots/${bot._id}/channels/${channel.slug}`).send({ slug: 'test1' })
        should.fail()
      } catch (err) {
        const res = err.response

        assert.equal(res.status, 409)
        assert.equal(res.body.message, 'Channel slug already exists')
      }
    })
  })

  describe('deleteChannelBotById', () => {
    it ('should be a 400 with an invalid bot_id', async () => {
      try {
        await chai.request(baseUrl).del(`/bots/1234/channels/test`).send()
        should.fail()
      } catch (err) {
        const res = err.response

        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'Parameter bot_id is invalid')
      }
    })
  })
})
