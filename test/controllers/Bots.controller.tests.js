import chai from 'chai'
import chaiHttp from 'chai-http'
import mongoose from 'mongoose'
import Bot from '../../src/models/Bot.model'
import Conversation from '../../src/models/Conversation.model'
import Channel from '../../src/models/Channel.model'

import BotsController from '../../src/controllers/Bots.controller'

import sinon from 'sinon'

const assert = require('chai').assert
const expect = chai.expect
const should = chai.should()

chai.use(chaiHttp)

function clearDB () {
  for (const i in mongoose.connection.collections) {
    if (mongoose.connection.collections.hasOwnProperty(i)) {
      mongoose.connection.collections[i].remove()
    }
  }
}

const url = 'https://bonjour.com'
const baseUrl = 'http://localhost:8080'
const updatedUrl = 'https://aurevoir.com'

describe('Bot controller', () => {
  describe('POST: create a bot', () => {
    after(async () => clearDB())
    it ('should be a 201', async () => {
      const res = await chai.request(baseUrl)
        .post('/bots').send({ url })
      const { message, results } = res.body

      assert.equal(res.status, 201)
      assert.equal(results.url, url)
      assert.equal(message, 'Bot successfully created')
    })
  })

  describe('GET: get bots', async () => {
    after(async () => clearDB())
    afterEach(async () => clearDB())

    it ('should be a 200 with bots', async () => {
      await Promise.all([
        new Bot({ url }).save(),
        new Bot({ url }).save(),
      ])
      const res = await chai.request(baseUrl).get('/bots').send()
      const { message, results } = res.body

      assert.equal(res.status, 200)
      assert.equal(results.length, 2)
      assert.equal(message, 'Bots successfully found')
    })

    it ('should be a 200 with no bots', async () => {
      const res = await chai.request(baseUrl).get('/bots').send()
      const { message, results } = res.body

      assert.equal(res.status, 200)
      assert.equal(results.length, 0)
      assert.equal(message, 'No Bots')
    })
  })

  describe('GET: get bot by id', () => {
    after(async () => clearDB())

    it ('should be a 200 with bots', async () => {
      const bot = await new Bot({ url }).save()
      const res = await chai.request(baseUrl).get(`/bots/${bot._id}`).send()
      const { message, results } = res.body

      assert.equal(res.status, 200)
      assert.equal(results.id, bot._id)
      assert.equal(results.url, bot.url)
      assert.equal(message, 'Bot successfully found')
    })

    it ('should be a 404 with no bots', async () => {
      try {
        await chai.request(baseUrl).get('/bots/582a4ced73b15653c074606b').send()
        should.fail()
      } catch (err) {
        const res = err.response
        const { message, results } = res.body

        assert.equal(res.status, 404)
        assert.equal(results, null)
        assert.equal(message, 'Bot not found')
      }
    })
  })

  describe('PUT: update a bot', () => {
    let bot = {}
    before(async () => bot = await new Bot({ url }).save())
    after(async () => clearDB())

    it ('should be a 200', async () => {
      const res = await chai.request(baseUrl).put(`/bots/${bot._id}`)
        .send({ url: updatedUrl })
      const { message, results } = res.body

      assert.equal(res.status, 200)
      assert.equal(results.url, updatedUrl)
      assert.equal(message, 'Bot successfully updated')
    })

    it ('should be a 404 with no bots', async () => {
      try {
        await chai.request(baseUrl).put('/bots/582a4ced73b15653c074606b').send({ url })
        should.fail()
      } catch (err) {
        const res = err.response
        const { message, results } = res.body

        assert.equal(res.status, 404)
        assert.equal(results, null)
        assert.equal(message, 'Bot not found')
      }
    })
  })

  describe('DELETE: delete a bot', () => {
    it ('should be a 200', async () => {
      let bot = await new Bot({ url }).save()
      const res = await chai.request(baseUrl).del(`/bots/${bot._id}`).send()
      const { message, results } = res.body

      assert.equal(res.status, 200)
      assert.equal(results, null)
      assert.equal(message, 'Bot successfully deleted')
    })

    it ('should be a 404 with no bots', async () => {
      try {
        await chai.request(baseUrl).del('/bots/582a4ced73b15653c074606b').send({ url })
        should.fail()
      } catch (err) {
        const res = err.response
        const { message, results } = res.body

        assert.equal(res.status, 404)
        assert.equal(results, null)
        assert.equal(message, 'Bot not found')
      }
    })
  })
})
