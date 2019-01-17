import chai from 'chai'
import { setupChannelIntegrationTests } from '../../../../test/tools'
import nock from 'nock'

const expect = chai.expect
const should = chai.should()

const channelCreationParams = {
  type: 'kik',
  slug: 'my-awesome-channel',
  userName: 'abcdefg-alias-id',
  apiKey: 'oauth-token',
}

describe('Kik channel', () => {

  const { createChannel, updateChannel,
    deleteChannel, sendMessageToWebhook } = setupChannelIntegrationTests()
  const kikAPI = 'https://api.kik.com'
  beforeEach(() => {
    nock(kikAPI).post('/v1/config').reply(200, {})
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
      nock(kikAPI).post('/v1/config').reply(200, {})
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

    it('should return 401 with invalid token', async () => {
      try {
        const headers = { 'x-kik-username': 'invalid-token' }
        await sendMessageToWebhook(channel, { message: 'message' }, headers)
        should.fail()
      } catch (error) {
        expect(error.status).to.equal(401)
      }
    })

    it('should return 401 without token', async () => {
      try {
        await sendMessageToWebhook(channel, {})
        should.fail()
      } catch (error) {
        expect(error.status).to.equal(401)
      }
    })

    it('should be successful with valid parameters', async () => {
      const senderId = 'sender-id'
      const message = {
        messages: [{
          type: 'text',
          body: 'a message',
          chatId: 123,
          participants: [senderId] }],
      }
      // isTyping call
      nock('https://api.kik.com').post('/v1/message').reply(200, {})
      nock('https://api.kik.com').get(`/v1/user/${senderId}`).times(2).reply(200, {})
      const outgoingMessageCall = nock('https://api.kik.com').post('/v1/message').reply(200, {})
      const headers = { 'x-kik-username': channelCreationParams.userName }
      const response = await sendMessageToWebhook(channel, message, headers)
      expect(response.status).to.equal(200)
      expect(outgoingMessageCall.isDone()).to.be.true
    })

    it('should be successful for card message', async () => {
      const senderId = 'sender-id'
      const chatId = 123
      const message = {
        messages: [{
          type: 'text',
          body: 'a message',
          chatId,
          participants: [senderId],
        }],
      }

      // isTyping call
      nock('https://api.kik.com').post('/v1/message').reply(200, {})
      nock('https://api.kik.com').get(`/v1/user/${senderId}`).times(2).reply(200, {})
      const firstOutgoingMessage = nock('https://api.kik.com')
        .post('/v1/message', {
          messages: [
            {
              chatId,
              to: senderId,
              type: 'text',
              body: 'title',
            },
          ],
        })
        .basicAuth({
          user: channel.userName,
          pass: channel.apiKey,
        })
        .reply(200, {})
      const secondOutgoingMessage = nock('https://api.kik.com')
        .post('/v1/message', {
          messages: [
            {
              chatId,
              type: 'picture',
              to: senderId,
              picUrl: 'https://img.url',
              keyboards: [
                {
                  type: 'suggested',
                  responses: [
                    {
                      type: 'text',
                      body: 'button title',
                    },
                  ],
                },
              ],
            },
          ],
        })
        .basicAuth({
          user: channel.userName,
          pass: channel.apiKey,
        })
        .reply(200, {})
      const headers = { 'x-kik-username': channelCreationParams.userName }
      const botResponse = {
        results: {},
        messages: JSON.stringify([{
          type: 'card',
          content: {
            title: 'title',
            subtitle: 'subtitle',
            imageUrl: 'https://img.url',
            buttons: [{ type: '', title: 'button title', value: 'abc' }],
          },
        }]),
      }
      const response = await sendMessageToWebhook(channel, message, headers, botResponse)
      expect(response.status).to.equal(200)
      expect(firstOutgoingMessage.isDone()).to.be.true
      expect(secondOutgoingMessage.isDone()).to.be.true
    })

    it('should be successful for list message', async () => {
      const senderId = 'sender-id'
      const chatId = 123
      const message = {
        messages: [{
          type: 'text',
          body: 'a message',
          chatId,
          participants: [senderId],
        }],
      }
      // isTyping call
      nock('https://api.kik.com').post('/v1/message').reply(200, {})
      nock('https://api.kik.com').get(`/v1/user/${senderId}`).times(2).reply(200, {})
      const firstOutgoingMessage = nock('https://api.kik.com')
        .post('/v1/message', {
          messages: [
            {
              chatId,
              type: 'text',
              to: senderId,
              body: '\ntitle\nsubtitle\nhttps://img.url',
            },
          ],
        })
        .basicAuth({
          user: channel.userName,
          pass: channel.apiKey,
        })
        .reply(200, {})
      const secondOutgoingMessage = nock('https://api.kik.com')
        .post('/v1/message', {
          messages: [
            {
              chatId,
              type: 'text',
              to: senderId,
              body: '\nSecond title\nSecond subtitle\nhttps://img.url',
              keyboards: [
                {
                  type: 'suggested',
                  responses: [
                    {
                      type: 'text',
                      body: 'button title',
                    },
                  ],
                },
              ],
            },
          ],
        })
        .basicAuth({
          user: channel.userName,
          pass: channel.apiKey,
        })
        .reply(200, {})
      const headers = { 'x-kik-username': channelCreationParams.userName }
      const botResponse = {
        results: {},
        messages: JSON.stringify([{
          type: 'list',
          content: {
            elements: [
              {
                title: 'title',
                subtitle: 'subtitle',
                imageUrl: 'https://img.url',
                buttons: [{ type: '', title: 'button title', value: 'abc' }],
              },
              {
                title: 'Second title',
                subtitle: 'Second subtitle',
                imageUrl: 'https://img.url',
                buttons: [],
              },
            ],
          },
        }]),
      }
      const response = await sendMessageToWebhook(channel, message, headers, botResponse)
      expect(response.status).to.equal(200)
      expect(firstOutgoingMessage.isDone()).to.be.true
      expect(secondOutgoingMessage.isDone()).to.be.true
    })

  })
})
