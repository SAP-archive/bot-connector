import chai from 'chai'
import { setupChannelIntegrationTests } from '../../../../test/tools'
import nock from 'nock'

const expect = chai.expect
const should = chai.should()

const channelCreationParams = {
  type: 'callr',
  slug: 'my-awesome-channel',
  password: 'password',
  userName: 'user',
}

describe('Callr channel', () => {

  const { createChannel, deleteChannel,
    updateChannel, sendMessageToWebhook } = setupChannelIntegrationTests()

  beforeEach(() => {
    nock(callrAPI).post('/json-rpc/v1.1/').reply(200, { result: { hash: 'webhook-hash' } })
  })
  const callrAPI = 'https://api.callr.com'

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
      newValues.password = 'newpassword'
      nock(callrAPI).post('/json-rpc/v1.1/').times(2).reply(200, { result: { } })
      response = await updateChannel(channel, newValues)
      expect(response.status).to.equal(200)
      expect(response.body.results.password).to.equal(newValues.password)
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
      const message = { data: { from: 'sender', to: 'receiver', text: 'a message' } }
      const headers = { 'x-callr-hmacsignature': 'sHMMGdzGhfW2urhzjUwY578gZct/lVFlAP3qrHTaUig=' }
      const outgoingMessageCall = nock(callrAPI).post('/json-rpc/v1.1/')
        .reply(200, { result: { message: 'message' } })
      const response = await sendMessageToWebhook(channel, message, headers)
      expect(response.status).to.equal(200)
      expect(outgoingMessageCall.isDone()).to.be.true
    })

    it('should return 401 with invalid token', async () => {
      try {
        const headers = { 'x-callr-hmacsignature': 'invalid' }
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

  })
})
