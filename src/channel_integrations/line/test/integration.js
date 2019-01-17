import chai from 'chai'
import { setupChannelIntegrationTests } from '../../../../test/tools'
import nock from 'nock'

/* eslint max-nested-callbacks: 0 */  // --> OFF

const expect = chai.expect
const should = chai.should()

const lineAPI = 'https://api.line.me'

const channelCreationParams = {
  type: 'line',
  slug: 'my-awesome-channel',
  clientSecret: 'client-secret',
  token: 'token',
}

describe('Line channel', () => {

  const { createChannel, updateChannel,
    deleteChannel, sendMessageToWebhook } = setupChannelIntegrationTests()

  describe('Creation', () => {
    it('should be successful with valid parameters', async () => {
      const response = await createChannel(channelCreationParams)
      const { results: result, message } = response.body

      expect(response.status).to.equal(201)
      expect(message).to.equal('Channel successfully created')
      expect(result.type).to.equal(channelCreationParams.type)
      expect(result.slug).to.equal(channelCreationParams.slug)
      /* eslint no-unused-expressions: 0 */  // --> OFF
      expect(result.isErrored).to.be.false
      expect(result.isActivated).to.be.true
    })

    it('should return 400 with invalid parameters', async () => {
      try {
        await createChannel({})
        should.fail()
      } catch (error) {
        expect(error.status).to.equal(400)
      }
    })
  })

  describe('Update', () => {
    it('should be successful if channel exists', async () => {
      let response = await createChannel(channelCreationParams)
      const channel = response.body.results
      const newValues = Object.assign({}, channelCreationParams)
      newValues.token = 'newtoken'
      response = await updateChannel(channel, newValues)
      expect(response.status).to.equal(200)
      expect(response.body.results.token).to.equal(newValues.token)
    })
  })

  describe('Deletion', () => {
    it('should be successful if channel exists', async () => {
      let response = await createChannel(channelCreationParams)
      const channel = response.body.results
      response = await deleteChannel(channel)
      expect(response.status).to.equal(200)
    })
  })

  describe('webhook url verification', () => {
    let channel

    const body = {
      events: [
        {
          replyToken: '00000000000000000000000000000000',
          type: 'message',
          timestamp: 1533154101667,
          source: {
            type: 'user',
            userId: 'Udeadbeefdeadbeefdeadbeefdeadbeef',
          },
          message: {
            id: '100001',
            type: 'text',
            text: 'Hello, world',
          },
        },
        {
          replyToken: 'ffffffffffffffffffffffffffffffff',
          type: 'message',
          timestamp: 1533154101667,
          source: {
            type: 'user',
            userId: 'Udeadbeefdeadbeefdeadbeefdeadbeef',
          },
          message: {
            id: 100002,
            type: 'sticker',
            packageId: '1',
            stickerId: '1',
          },
        },
      ],
    }
    const headers = { 'x-line-signature': 'AziZnbmnjOTxmYKhlJrQLeFfmuybTQmywm7p5dT5UEc=' }

    beforeEach(async () => {
      channel = (await createChannel(channelCreationParams)).body.results
    })

    it('should be successful and not send any message', async () => {
      const response = await sendMessageToWebhook(channel, body, headers)
      expect(response.status).to.equal(200)
    })
  })

  describe('sending a message', () => {

    let channel

    beforeEach(async () => {
      channel = (await createChannel(channelCreationParams)).body.results
    })

    const body = { events: [{
      type: 'message',
      source: { type: 'user', userId: 'userid' },
      message: { type: 'text', text: 'a test message' },
    }] }
    const headers = { 'x-line-signature': 'syDEWaFckSt/T1qAy0R/WCVWygSSOWcJrPs61aGFdIg=' }

    it('should be successful with valid token', async () => {
      nock(lineAPI).get('/v2/bot/profile/userid').reply(200, {})
      const outgoingMessageCall = nock(lineAPI).post('/v2/bot/message/reply').reply(200, {})
      const response = await sendMessageToWebhook(channel, body, headers)
      expect(response.status).to.equal(200)
      expect(outgoingMessageCall.isDone()).to.be.true
    })

    it('should return 401 with invalid token', async () => {
      try {
        const headers = { 'x-twilio-signature': 'invalid' }
        await sendMessageToWebhook(channel, {}, headers)
        should.fail()
      } catch (error) {
        expect(error.status).to.equal(401)
      }
    })

    it('should return 401 without a token', async () => {
      try {
        await sendMessageToWebhook(channel, {})
        should.fail()
      } catch (error) {
        expect(error.status).to.equal(401)
      }
    })

    describe('should be successful', () => {

      beforeEach(async () => {
        nock(lineAPI).get('/v2/bot/profile/userid').reply(200, {})
        nock(lineAPI).post('/v2/bot/message/reply').reply(200, {})

      })

      it('in list format', async () => {
        const buttons = [
          { type: 'account_link', title: 'button title', value: 'https://link.com' },
          { type: 'web_url', title: 'button title', value: 'https://link.com' },
          { type: 'phone_number', title: 'button title', value: '0123554' }]
        const listElement = {
          title: 'title',
          subtitle: 'subtitle',
          imageUrl: 'https://img.url',
          buttons,
        }
        const botResponse = {
          results: {},
          messages: JSON.stringify([{
            type: 'list',
            content: { elements: [listElement], buttons },
          }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
      })

      it('in card format', async () => {
        const cardElement = {
          title: 'title',
          subtitle: 'subtitle',
          imageUrl: 'https://img.url',
          buttons: [{ type: '', title: 'button title', value: 'abc' }],
        }
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'card', content: cardElement }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
      })

      it('in carousel format', async () => {
        const carouselElement = {
          title: 'title',
          imageUrl: 'https://img.url',
          buttons: [{ type: '', title: 'button title', value: 'abc' }],
        }
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'carousel', content: [carouselElement] }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
      })

      it('in quickReplies format', async () => {
        const buttonsElement = {
          title: 'title',
          buttons: [{ type: '', title: 'button title', value: 'abc' }],
        }
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'quickReplies', content: buttonsElement }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
      })

      it('in video format', async () => {
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'video', content: 'https://link.com' }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
      })

      it('in buttons format', async () => {
        const buttonsElement = {
          title: 'title',
          buttons: [{ type: '', title: 'button title', value: 'abc' }],
        }
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'buttons', content: buttonsElement }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
      })
    })

  })
})
