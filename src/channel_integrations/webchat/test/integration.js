import chai from 'chai'
import { setupChannelIntegrationTests } from '../../../../test/tools'

const expect = chai.expect
const channelCreationParams = {
  type: 'webchat',
  slug: 'my-awesome-channel',
}

describe('Webchat channel', () => {

  const { createChannel, deleteChannel, updateChannel,
    sendMessageToWebhook } = setupChannelIntegrationTests()

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

  describe('sending a message', () => {

    let channel

    beforeEach(async () => {
      channel = (await createChannel(channelCreationParams)).body.results
    })

    it('should be successful with valid parameters', async () => {
      const response = await sendMessageToWebhook(channel, {
        chatId: 123,
        message: { attachment: { type: 'text', content: { value: 'a message' } } },
      })
      expect(response.status).to.equal(200)
    })

  })
})
