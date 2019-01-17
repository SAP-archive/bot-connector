import chai from 'chai'
import { setupChannelIntegrationTests } from '../../../../test/tools'
import nock from 'nock'
import { Channel, Connector } from '../../../models'
import _ from 'lodash'

/* eslint max-nested-callbacks: 0 */  // --> OFF

const expect = chai.expect
const should = chai.should()
const channelCreationParams = {
  type: 'twitter',
  slug: 'my-awesome-channel',
  consumerKey: 'consumerkey',
  consumerSecret: 'consumersecret',
  accessToken: 'accesstoken',
  accessTokenSecret: 'accesstokensecret',
}

describe('Twitter channel', () => {

  // Need to increase timeout, because channel creation contains hard-coded 4s delay
  const creationTimeout = 10000
  const { createChannel, updateChannel,
    deleteChannel, sendMessageToWebhook } = setupChannelIntegrationTests(false)
  const twitterAPI = 'https://api.twitter.com'

  let channel
  // Only create channel once to avoid long test runs due to hard-coded 4s delay in creation call
  before(function (done) {
    // Mock Twitter API calls
    const webhook = { valid: true, id: 123, url: 'webhook' }
    nock(twitterAPI).get('/1.1/account_activity/webhooks.json').query(true).reply(200, [{ id: 0 }])
    nock(twitterAPI).delete('/1.1/account_activity/webhooks/0.json').query(true).reply(200, {})
    nock(twitterAPI).post('/1.1/account_activity/webhooks.json').query(true).reply(200, webhook)
    nock(twitterAPI).post('/1.1/account_activity/webhooks/123/subscriptions.json')
      .query(true).reply(200, {})
    nock(twitterAPI).get('/1.1/account/verify_credentials.json').query(true).reply(200, {
      data: { id_str: 'client-id' },
    })
    this.timeout(creationTimeout)
    createChannel(channelCreationParams).then((result) => {
      channel = result.body.results
      done()
    })
  })

  after(async () => {
    await Connector.remove()
    await Channel.remove()
  })

  describe('Creation', () => {
    it('should be successful with valid parameters', async () => {
      expect(channel.type).to.equal(channelCreationParams.type)
      expect(channel.slug).to.equal(channelCreationParams.slug)
      /* eslint no-unused-expressions: 0 */  // --> OFF
      expect(channel.isErrored).to.be.false
      expect(channel.isActivated).to.be.true
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
      const newValues = JSON.parse(JSON.stringify(channelCreationParams))
      newValues.accessToken = 'newtoken'
      nock(twitterAPI).delete('/1.1/account_activity/webhooks/123.json').reply(200, {})
      const response = await updateChannel(channel, newValues)
      expect(response.status).to.equal(200)
      expect(response.body.results.accessToken).to.equal(newValues.accessToken)
    })
  })

  describe('Deletion', () => {
    it('should be successful if channel exists', async () => {
      const deletableChannel = _.cloneDeep(channelCreationParams)
      deletableChannel.slug = 'to-be-deleted'
      let response = await createChannel(deletableChannel)
      const deleteMe = response.body.results
      nock(twitterAPI).delete('/1.1/account_activity/webhooks/undefined.json').reply(200, {})
      nock(twitterAPI).post('/1.1/account_activity/webhooks/').reply(200, {})
      response = await deleteChannel(deleteMe)
      expect(response.status).to.equal(200)
    })
  })

  describe('sending a message', () => {

    it('should return 401 with invalid token', async () => {
      try {
        await sendMessageToWebhook(channel, {}, { 'X-Twitter-Webhooks-Signature': 'invalid-token' })
        should.fail()
      } catch (error) {
        expect(error.status).to.equal(401)
        expect(error.response.body.message).to.equal('Invalid Twitter signature')
      }
    })

    it('should return 401 without token', async () => {
      try {
        await sendMessageToWebhook(channel, {})
        should.fail()
      } catch (error) {
        expect(error.status).to.equal(401)
        expect(error.response.body.message).to.equal('Invalid Twitter signature')
      }
    })

    describe('should be successful', () => {

      beforeEach(() => {
        nock(twitterAPI).get('/1.1/users/lookup.json').query(true).reply(200, {})
      })

      const body = {
        direct_message_events: [
          {
            message_create: {
              sender_id: 456,
              target: {
                // recipient_id: channelCreationParams.clientId,
              },
              message_data: {
                text: 'a message',
              },
            },
          },
        ],
      }
      const signature = 'sha256=9a0dmwmJem4AvLj2aKpSqcvWv9SAVGH0BWZkAPNsMjg='
      const headers = { 'X-Twitter-Webhooks-Signature': signature }

      it('in text format', async () => {
        const response = await sendMessageToWebhook(channel, body, headers)
        expect(response.status).to.equal(200)
      })

      // The twitter integration wants to upload attached image files to twitter
      // Not sure how to mock this, so skipping those test cases for now

      it.skip('in list format', async () => {
        const buttons = [
          { type: 'account_link', title: 'button title', value: 'https://link.com' },
          { type: 'web_url', title: 'button title', value: 'https://link.com' },
          { type: 'phone_number', title: 'button title', value: '0123554' }]
        const listElement = {
          title: 'title',
          subtitle: 'subtitle',
          imageUrl: 'https://image.png',
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

      it.skip('in card format', async () => {
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

      it.skip('in carousel format', async () => {
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

      it.skip('in video format', async () => {
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'video', content: 'https://link.com' }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
      })

      it.skip('in picture format', async () => {
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
