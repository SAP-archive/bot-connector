import chai from 'chai'
import chaiHttp from 'chai-http'
import mongoose from 'mongoose'

import Bot from '../../src/models/Bot.model'

const assert = require('chai').assert
const expect = chai.expect
const should = chai.should()

chai.use(chaiHttp)

const baseUrl = 'http://localhost:8080'

describe('Bot validator', () => {
  describe('createBot', () => {
    it('should be a 400 with an invalid url', async () => {
      try {
        await chai.request(baseUrl).post('/bots').send()
        should.fail()
      } catch (err) {
        const res = err.response

        assert.equal(res.status, 400)
        assert.equal(res.body.message, 'Parameter url is invalid')
      }
    })
  })

  describe('getBotById', () => {
    it('should be a 400 with an invalid bot_id', async () => {
      try {
        await chai.request(baseUrl).get('/bots/12345').send()
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

  describe('updateBotById', () => {
    let bot = {}
    before(async () => bot = await new Bot({ url: 'https://test.com' }))

    it('should be a 400 with an invalid bot_id', async () => {
      try {
        await chai.request(baseUrl).put('/bots/12345').send()
        should.fail()
      } catch (err) {
        const res = err.response
        const { message, results } = res.body

        assert.equal(res.status, 400)
        assert.equal(results, null)
        assert.equal(message, 'Parameter bot_id is invalid')
      }
    })

    it('should be a 400 with an invalid url', async () => {
      try {
        const res = await chai.request(baseUrl).put(`/bots/${bot._id}`).send({ url: 'invalid' })
        should.fail()
      } catch (err) {
        const res = err.response
        const { message, results } = res.body

        assert.equal(res.status, 400)
        assert.equal(results, null)
        assert.equal(message, 'Parameter url is invalid')
      }
    })
  })

  describe('deleteBotById', () => {
    it('should be a 400 with an invalid bot_id', async () => {
      try {
        await chai.request(baseUrl).del('/bots/12345').send()
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
})

