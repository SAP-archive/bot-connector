import chai from 'chai'
import { setupChannelIntegrationTests } from '../../../../test/tools'
import crypto from 'crypto'
import _ from 'lodash'
import nock from 'nock'

const expect = chai.expect
const should = chai.should()

const channelCreationParams = {
  type: 'twilio',
  slug: 'my-awesome-channel',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  serviceId: 'service-id',
  phoneNumber: 'phone-number',
}

describe('Twilio channel', () => {

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
      const newValues = JSON.parse(JSON.stringify(channelCreationParams))
      newValues.clientId = 'newclientId'
      response = await updateChannel(channel, newValues)
      expect(response.status).to.equal(200)
      expect(response.body.results.clientId).to.equal(newValues.clientId)
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

  describe('sending a message', () => {

    let channel

    beforeEach(async () => {
      channel = (await createChannel(channelCreationParams)).body.results
    })

    it('should be successful with valid token', async () => {
      const outgoingMessageCall = nock('https://api.twilio.com')
        .post('/2010-04-01/Accounts/client-id/Messages.json').reply(200, {})
      const message = { To: 'recipient', From: 'sender', Body: 'Text' }
      let signature = channel.webhook
      /* eslint max-nested-callbacks: ["error", 4]*/
      _.forOwn(_.sortBy(Object.keys(message)), (key) => {
        signature += key
        signature += message[key]
      })
      const hmac = crypto.createHmac('SHA1', channel.clientSecret)
        .update(signature)
        .digest('base64')
      const headers = { 'x-twilio-signature': hmac }
      const response = await sendMessageToWebhook(channel, message, headers)
      expect(response.status).to.equal(200)
      expect(outgoingMessageCall.isDone()).to.be.true
    })

    it('should not send a response for an empty incoming message', async () => {
      const outgoingMessageCall = nock('https://api.twilio.com')
        .post('/2010-04-01/Accounts/client-id/Messages.json').reply(200, {})
      const message = { To: 'recipient', From: 'sender' }
      let signature = channel.webhook
      /* eslint max-nested-callbacks: ["error", 4]*/
      _.forOwn(_.sortBy(Object.keys(message)), (key) => {
        signature += key
        signature += message[key]
      })
      const hmac = crypto.createHmac('SHA1', channel.clientSecret)
        .update(signature)
        .digest('base64')
      const headers = { 'x-twilio-signature': hmac }
      const response = await sendMessageToWebhook(channel, message, headers)
      expect(response.status).to.equal(200)
      expect(outgoingMessageCall.isDone()).to.be.false
    })

    it('should return 401 with invalid token', async () => {
      try {
        const headers = { 'x-twilio-signature': 'invalid' }
        const message = { To: 'recipient', From: 'sender' }
        await sendMessageToWebhook(channel, message, headers)
        should.fail()
      } catch (error) {
        expect(error.status).to.equal(401)
      }
    })

    it('should return 401 without a token', async () => {
      try {
        const message = { To: 'recipient', From: 'sender' }
        await sendMessageToWebhook(channel, message)
        should.fail()
      } catch (error) {
        expect(error.status).to.equal(401)
      }
    })

  })
})
