import chai from 'chai'
import chaiHttp from 'chai-http'
import sinon from 'sinon'

import model from '../../src/models'
import Bot from '../../src/models/Bot.model'
import Channel from '../../src/models/Channel.model'
import KikService from '../../src/services/Kik.service'

import config from '../../config'

const assert = require('chai').assert
const expect = chai.expect
const should = chai.should()

chai.use(chaiHttp)

const url = 'https://bonjour.com'
const baseUrl = 'http://localhost:8080'
const channelPayload = {
  type: 'slack',
  isActivated: true,
  slug: 'slack-test',
  token: 'test-token',
}

describe('Channel controller', () => {
  let bot = {}
  before(async () => bot = await Bot({ url }).save())
  after(async () => await Bot.remove({}))

  describe('POST: create a channel', () => {
    afterEach(async () => Promise.all([Channel.remove({})]))

    it ('should be a 201', async () => {
      const res = await chai.request(baseUrl).post(`/bots/${bot._id}/channels`)
        .send(channelPayload)
      const { message, results } = res.body

      assert.equal(res.status, 201)
      assert.equal(results.type, channelPayload.type)
  assert.equal(results.isActivated, channelPayload.isActivated)
    assert.equal(results.slug, channelPayload.slug)
    assert.equal(results.token, channelPayload.token)
    assert.equal(message, 'Channel successfully created')
  })

  it ('should be a 404 with no bots', async () => {
    try {
      const newBot = await new Bot({ url }).save()
      await Bot.remove({ _id: newBot._id })
      const res = await chai.request(baseUrl).post(`/bots/${newBot._id}/channels`)
        .send(channelPayload)
      should.fail()
    } catch (err) {
      const res = err.response
      const { message, results } = res.body

      assert.equal(res.status, 404)
      assert.equal(results, null)
      assert.equal(message, 'Bot not found')
    }
  })

  it ('should be a 409 with a slug already existing', async () => {
    const payload = { type: 'slack', isActivated: true, slug: 'test', token: 'test-token' }
    const channel = await new Channel({ ...payload, bot: bot._id }).save()
    try {
      await chai.request(baseUrl).post(`/bots/${bot._id}/channels`).send(payload)
      should.fail()
    } catch (err) {
      const res = err.response

      assert.equal(res.status, 409)
      assert.equal(res.body.message, 'Channel slug already exists')
    }
  })
})

  describe('GET: get a bot\'s channels', () => {
   afterEach(async () => Channel.remove({}))

    it ('should be a 200 with channels', async () => {
      await Promise.all([
        new Channel({ bot: bot._id, ...channelPayload }).save(),
        new Channel({ bot: bot._id, ...channelPayload }).save(),
      ])
      const res = await chai.request(baseUrl).get(`/bots/${bot._id}/channels`).send()
      const { message, results } = res.body

      assert.equal(res.status, 200)
      assert.equal(results.length, 2)
      assert.equal(message, 'Channels successfully rendered')
    })

    it ('should be a 200 with no channels', async () => {
      const res = await chai.request(baseUrl).get(`/bots/${bot._id}/channels`).send()
      const { message, results } = res.body

      assert.equal(res.status, 200)
      assert.equal(results.length, 0)
      assert.equal(message, 'No channels')
    })
  })

  describe('GET: get a bot\'s channel', () => {
    afterEach(async () => Channel.remove({}))

    it('should be a 200 with a channel', async () => {
      const channel = await new Channel({ bot: bot._id, ...channelPayload }).save()
      const res = await chai.request(baseUrl).get(`/bots/${bot._id}/channels/${channel.slug}`).send()
      const { message, results } = res.body

      assert.equal(res.status, 200)
      assert.equal(results.id, channel._id)
      assert.equal(results.slug, channel.slug)
      assert.equal(message, 'Channel successfully rendered')
    })

    it('should be a 404 with no channels', async () => {
      try {
        const channel = await new Channel({ bot: bot._id, ...channelPayload }).save()
        await Channel.remove({})
        const res = await chai.request(baseUrl).get(`/bots/${bot._id}/channels/${channel.slug}`).send()
        should.fail()
      } catch (err) {
        const res = err.response
        const { message, results } = res.body

        assert.equal(res.status, 404)
        assert.equal(results, null)
        assert.equal(message, 'Channel not found')
      }
    })
  })

  describe('PUT: update a channel', () => {
    afterEach(async () => Channel.remove({}))

    it('should be a 200 with a channel', async () => {
      const channel = await new Channel({ bot: bot._id, ...channelPayload }).save()
      const res = await chai.request(baseUrl).put(`/bots/${bot._id}/channels/${channel.slug}`).send({ slug: 'updatedSlug' })
      const { message, results } = res.body

      assert.equal(res.status, 200)
      assert.equal(results.slug, 'updatedSlug')
      assert.equal(message, 'Channel successfully updated')
    })

    it('should be a 404 with no channels', async () => {
      try {
        const channel = await new Channel({ bot: bot._id, ...channelPayload }).save()
        await Channel.remove({})
        const res = await chai.request(baseUrl).put(`/bots/${bot._id}/channels/${channel.slug}`).send()
        should.fail()
      } catch (err) {
        const res = err.response
        const { message, results } = res.body

        assert.equal(res.status, 404)
        assert.equal(results, null)
        assert.equal(message, 'Channel not found')
      }
    })
  })

  describe('DELETE: delete a channel', () => {
    it('should be a 200 with a channel', async () => {
      const channel = await new Channel({ bot: bot._id, ...channelPayload }).save()
      bot.channels.push(channel._id)
      await bot.save()
      const res = await chai.request(baseUrl).del(`/bots/${bot._id}/channels/${channel.slug}`).send({ slug: 'updatedSlug' })
      const { message, results } = res.body

      assert.equal(res.status, 200)
      assert.equal(results, null)
      assert.equal(message, 'Channel successfully deleted')
    })

    it('should be a 404 with no channels', async () => {
      try {
        const channel = await new Channel({ bot: bot._id, ...channelPayload }).save()
        await Channel.remove({})
        const res = await chai.request(baseUrl).del(`/bots/${bot._id}/channels/${channel.slug}`).send()
        should.fail()
      } catch (err) {
        const res = err.response
        const { message, results } = res.body

        assert.equal(res.status, 404)
        assert.equal(results, null)
        assert.equal(message, 'Channel not found')
      }
    })
  })
})
