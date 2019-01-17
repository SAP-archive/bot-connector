import chai from 'chai'
import { setupChannelIntegrationTests } from '../../../../test/tools'

const expect = chai.expect
const should = chai.should()
const channelCreationParams = {
  type: 'slackapp',
  slug: 'my-awesome-channel',
  clientId: 'client-id',
  clientSecret: 'client-secret',
}

/* eslint no-unused-expressions: 0 */  // --> OFF

describe('Slack App channel', () => {

  const { createChannel, updateChannel, deleteChannel } = setupChannelIntegrationTests()

  describe('Creation', () => {
    it('should be successful with valid parameters', async () => {
      const response = await createChannel(channelCreationParams)
      const { results: result, message } = response.body

      expect(response.status).to.equal(201)
      expect(message).to.equal('Channel successfully created')
      expect(result.children).to.be.empty
      expect(result.type).to.equal(channelCreationParams.type)
      expect(result.slug).to.equal(channelCreationParams.slug)
      expect(result.isErrored).to.be.false
      expect(result.isActivated).to.be.true
      expect(result.oAuthUrl.startsWith(`${process.env.ROUTETEST}/v1/oauth/slack/`)).to.be.true
      expect(result.webhook.startsWith(`${process.env.ROUTETEST}/v1/webhook/`)).to.be.true
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
      newValues.clientSecret = 'newsecret'
      response = await updateChannel(channel, newValues)
      expect(response.status).to.equal(200)
      expect(response.body.results.clientSecret).to.equal(newValues.clientSecret)
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
})
