import chai from 'chai'
import { setupChannelIntegrationTests } from '../../../../test/tools'
import nock from 'nock'

/* eslint max-nested-callbacks: 0 */  // --> OFF

const expect = chai.expect
const should = chai.should()

const channelCreationParams = {
  type: 'ciscospark',
  slug: 'my-awesome-channel',
  token: 'token',
}

describe('Cisco Spark channel', () => {

  const { createChannel, updateChannel,
    deleteChannel, sendMessageToWebhook } = setupChannelIntegrationTests()
  const sparkAPI = 'https://api.ciscospark.com'

  beforeEach(() => {
    nock(sparkAPI).get('/v1/people/me').reply(200, {})
    nock(sparkAPI).post('/v1/webhooks').reply(200, {})
  })

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
      nock(sparkAPI).get('/v1/people/me').reply(200, {})
      nock(sparkAPI).get('/v1/webhooks').query(true).reply(200, {})
      nock(sparkAPI).post('/v1/webhooks').reply(200, {})
      response = await updateChannel(channel, newValues)
      expect(response.status).to.equal(200)
      expect(response.body.results.token).to.equal(newValues.token)
    })
  })

  describe('Deletion', () => {
    it('should be successful if channel exists', async () => {
      let response = await createChannel(channelCreationParams)
      const channel = response.body.results
      nock(sparkAPI).get('/v1/webhooks').query(true).reply(200, {})

      response = await deleteChannel(channel)
      expect(response.status).to.equal(200)
    })
  })

  describe('sending a message', () => {

    let channel

    beforeEach(async () => {
      channel = (await createChannel(channelCreationParams)).body.results
    })

    it('should be successful with valid parameters', async () => {
      nock(sparkAPI).get('/v1/messages/message-id').query(true).reply(
        200, { personId: 123, text: 'text' })
      const outgoingMessageCall = nock(sparkAPI).post('/v1/messages').reply(200, {})
      const response = await sendMessageToWebhook(channel, {
        data: { roomId: 'room-id', personId: 'person-id', id: 'message-id' },
      })
      expect(response.status).to.equal(200)
      // Assert that response was sent to Cisco API
      expect(outgoingMessageCall.isDone()).to.be.true
    })

    it('should not send a response for an empty incoming message', async () => {
      nock(sparkAPI).get('/v1/messages/message-id').query(true).reply(
        200, { personId: 123, text: '' })
      const outgoingMessageCall = nock(sparkAPI).post('/v1/messages').reply(200, {})
      const response = await sendMessageToWebhook(channel, {
        data: { roomId: 'room-id', personId: 'person-id', id: 'message-id' },
      })
      expect(response.status).to.equal(200)
      // Assert that response was sent to Cisco API
      expect(outgoingMessageCall.isDone()).to.be.false
    })

    describe('should be successful', () => {

      beforeEach(async () => {
        nock(sparkAPI).get('/v1/messages/message-id').query(true).reply(
          200, { personId: 123, text: 'text' })
        nock(sparkAPI).post('/v1/messages').reply(200, {})
      })

      const body = {
        data: { roomId: 'room-id', personId: 'person-id', id: 'message-id' },
      }
      const headers = {}

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

      it('in picture format', async () => {
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'picture', content: 'https://link.com' }]),
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
