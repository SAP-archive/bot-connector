import chai from 'chai'
import superagent from 'superagent'
import superagentPromise from 'superagent-promise'
import { setupChannelIntegrationTests } from '../../../../test/tools'

const agent = superagentPromise(superagent, Promise)
const expect = chai.expect
const should = chai.should()
const channelCreationParams = {
  type: 'microsoft',
  slug: 'my-awesome-channel',
  clientId: 'client-id',
  clientSecret: 'client-secret',
}

describe('Microsoft channel', () => {

  const { createChannel } = setupChannelIntegrationTests()

  describe('Creation', () => {
    it('should be successful with valid parameters', async () => {
      const response = await createChannel(channelCreationParams)
      const { results: result, message } = response.body

      expect(response.status).to.equal(201)
      expect(message).to.equal('Channel successfully created')
      expect(result.type).to.equal(channelCreationParams.type)
      expect(result.slug).to.equal(channelCreationParams.slug)
    })

    it('should return 400 for valid parameters', async () => {
      try {
        await createChannel({ type: 'microsoft', slug: 'my-awesome-channel' })
        should.fail()
      } catch (error) {
        expect(error.status).to.equal(400)
      }
    })
  })

  describe('test webchat in Azure portal', () => {
    let channel

    beforeEach(async () => {
      channel = (await createChannel(channelCreationParams)).body.results
    })

    it('should be successful for pulse check', async () => {
      const response = await agent.get(channel.webhook)
      expect(response.status).to.equal(200)
    })
  })

  describe('sending a message', () => {

    it('should be successful with valid parameters')

  })
})
