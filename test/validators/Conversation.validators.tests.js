import chai from 'chai'
import chaiHttp from 'chai-http'
import mongoose from 'mongoose'

import Bot from '../../src/models/Bot.model'

const assert = require('chai').assert
const expect = chai.expect
const should = chai.should()

chai.use(chaiHttp)

const url = 'https://bonjour.com'
const baseUrl = 'http://localhost:8080'

describe('Conversation validator', () => {
  describe('getConversationByBotId', () => {
    it('should be a 400 with an invalid bot_id', async () => {
      try {
        await chai.request(baseUrl).get('/bots/12345/conversations').send()
        should.fail()
      } catch (err) {
        const res = err.response
        const { message, results } = res.body

        assert.equal(res.status, 400)
        assert.equal(results, null)
        assert.equal(message, 'Parameter bot_id is invalid')
      }
    })
  })

  describe('getConversationsByBotId', () => {
    let bot = {}
    before(async () => bot = await new Bot({ url }).save())
    after(async () => Bot.remove({}))

    it('should be a 400 with an invalid bot_id', async () => {
      try {
        await chai.request(baseUrl).get('/bots/1234/conversations/test').send()
        should.fail()
      } catch (err) {
        const res = err.response
        const { message, results } = res.body

        assert.equal(res.status, 400)
        assert.equal(results, null)
        assert.equal(message, 'Parameter bot_id is invalid')
      }
    })

    it('should be a 400 with an invalid conversation_id', async () => {
      try {
        await chai.request(baseUrl).get(`/bots/${bot._id}/conversations/test`).send()
        should.fail()
      } catch (err) {
        const res = err.response
        const { message, results } = res.body

        assert.equal(res.status, 400)
        assert.equal(results, null)
        assert.equal(message, 'Parameter conversation_id is invalid')
      }
    })
  })

  describe('deleteConversationByBotId', () => {
    let bot = {}
    before(async () => bot = await new Bot({ url }).save())
    after(async () => Bot.remove({}))

    it('should be a 400 with an invalid bot_id', async () => {
      try {
        await chai.request(baseUrl).del('/bots/1234/conversations/test').send()
        should.fail()
      } catch (err) {
        const res = err.response
        const { message, results } = res.body

        assert.equal(res.status, 400)
        assert.equal(results, null)
        assert.equal(message, 'Parameter bot_id is invalid')
      }
    })

    it('should be a 400 with an invalid conversation_id', async () => {
      try {
        await chai.request(baseUrl).del(`/bots/${bot._id}/conversations/test`).send()
        should.fail()
      } catch (err) {
        const res = err.response
        const { message, results } = res.body

        assert.equal(res.status, 400)
        assert.equal(results, null)
        assert.equal(message, 'Parameter conversation_id is invalid')
      }
    })
  })
})


