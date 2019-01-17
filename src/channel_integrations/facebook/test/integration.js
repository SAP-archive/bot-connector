import chai from 'chai'
import { setupChannelIntegrationTests } from '../../../../test/tools'
import nock from 'nock'
import _ from 'lodash'
import qs from 'qs'

const expect = chai.expect
const should = chai.should()

/* eslint max-nested-callbacks: 0 */  // --> OFF

const channelCreationParams = {
  type: 'messenger',
  slug: 'my-awesome-channel',
  apiKey: 'api-key',
  serviceId: 'service-id',
  token: 'token',
}

describe('Facebook Messenger Channel', () => {

  const { createChannel, deleteChannel,
    updateChannel, sendMessageToWebhook } = setupChannelIntegrationTests()
  const facebookAPI = 'https://graph.facebook.com:443'

  beforeEach(async () => {
    nock(facebookAPI).post('/v2.11/service-id/subscribed_apps').query(true).reply(200, {})
  })

  describe('creation', () => {
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
      nock(facebookAPI).post('/v2.11/service-id/subscribed_apps')
        .times(2).query(true).reply(200, {})
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
    const senderId = 456
    const body = {
      entry: [{
        messaging: [{
          message: {
            text: 'my message',
          },
          text: 'my message',
          recipient: { id: channelCreationParams.serviceId },
          sender: { id: senderId },
        }],
      }],
    }

    beforeEach(async () => {
      channel = (await createChannel(channelCreationParams)).body.results
    })

    // Hard-coded for testing purposes
    const signature = 'sha1=a3a1f35918b7b8c8d187e75dfa793a843e5c2b3c'
    const headers = { 'x-hub-signature': signature }

    it('should be successful with valid parameters and valid signature', async () => {
      nock(facebookAPI).get('/v2.11/456').query(true).reply(200, {
        id: senderId,
      })
      const outgoingMessageCall = nock(facebookAPI).post('/v2.11/me/messages')
        .times(2)
        .reply(200, {})
      const outgoingMessageCallPromise = new Promise((resolve) => {
        outgoingMessageCall.on('replied', () => {
          if (outgoingMessageCall.isDone()) {
            resolve()
          }
        })
      })
      const response = await sendMessageToWebhook(channel, body, headers)
      expect(response.status).to.equal(200)
      await outgoingMessageCallPromise
    })

    it('should return 401 with valid parameters, but invalid signature', async () => {
      try {
        const signature = 'sha1=invalid-signature'
        const headers = { 'x-hub-signature': signature }
        await sendMessageToWebhook(channel, body, headers)
        should.fail()
      } catch (error) {
        expect(error.status).to.equal(401)
      }
    })

    function mockIsTypingCall () {
      const isTypingCall = nock(facebookAPI).post('/v2.11/me/messages', (requestBody) => {
        const expectedQuery = {
          access_token: channelCreationParams.token,
          appsecret_proof: 'a0db4e58b0b2a5434a6f95e1ed797f311e42feee3c71f7c6f057a649ef1a8291',
          recipient: { id: `${senderId}` },
          sender_action: 'typing_on',
        }
        return _.isEqual(expectedQuery, qs.parse(requestBody))
      }).query(true).reply(200, {})
      return isTypingCall
    }

    describe('should be successful', () => {

      beforeEach(async () => {
        nock(facebookAPI).get(`/v2.11/${senderId}`).query(true).reply(200, {
          id: senderId,
        })
      })

      describe('in list format', () => {
        // Facebook Messenger supports lists with 2 - 4 elements (2018-08-02)

        it('with too few elements')

        it('with supported length', async () => {
          const listElement = {
            title: 'title',
            subtitle: 'subtitle',
            imageUrl: 'https://img.url',
            buttons: [
              { type: 'account_link', title: 'button title', value: 'https://link.com' },
              { type: 'web_url', title: 'button title', value: 'https://link.com' },
              { type: 'phone_number', title: 'button title', value: '0123554' }],
          }
          const isTypingCall = mockIsTypingCall()
          const isTypingCallPromise = new Promise((resolve) => {
            isTypingCall.on('replied', () => {
              if (isTypingCall.isDone()) {
                resolve()
              }
            })
          })
          const messageCall = nock(facebookAPI).post('/v2.11/me/messages', (requestBody) => {
            const parsed = qs.parse(requestBody)
            // https://developers.facebook.com/docs/messenger-platform/send-messages/template/list
            const expectedQuery = {
              access_token: channelCreationParams.token,
              appsecret_proof: 'a0db4e58b0b2a5434a6f95e1ed797f311e42feee3c71f7c6f057a649ef1a8291',
              messaging_type: 'RESPONSE',
              recipient: { id: `${senderId}` },
              message: {
                attachment: {
                  type: 'template',
                  payload: {
                    template_type: 'list',
                    elements: Array(2).fill({
                      title: listElement.title,
                      subtitle: listElement.subtitle,
                      image_url: listElement.imageUrl,
                      buttons: {
                        // 'qs' module has trouble parsing FB's query body
                        '[0][title]': listElement.buttons[0].title,
                        '[0][type]': listElement.buttons[0].type,
                        '[0][url]': listElement.buttons[0].value,
                        '[1][title]': listElement.buttons[1].title,
                        '[1][type]': listElement.buttons[1].type,
                        '[1][url]': listElement.buttons[1].value,
                        '[2][title]': listElement.buttons[2].title,
                        '[2][type]': listElement.buttons[2].type,
                        '[2][payload]': listElement.buttons[2].value,
                      },
                    }),
                  },
                },
              },
            }
            return _.isEqual(expectedQuery, parsed)
          }).query(true).reply(200, {})
          const messageCallPromise = new Promise((resolve) => {
            messageCall.on('replied', () => {
              if (messageCall.isDone()) {
                resolve()
              }
            })
          })
          const botResponse = {
            results: {},
            messages: JSON.stringify([{
              type: 'list',
              content: { elements: Array(2).fill(listElement) },
            }]),
          }
          const response = await sendMessageToWebhook(channel, body, headers, botResponse)
          expect(response.status).to.equal(200)
          return Promise.all([isTypingCallPromise, messageCallPromise])
        })

        it('with too many elements')
      })

      it('in card format', async () => {
        const cardElement = {
          title: 'title',
          subtitle: 'subtitle',
          imageUrl: 'https://img.url',
          buttons: [{ type: '', title: 'button title', value: 'abc' }],
        }
        const isTypingCall = mockIsTypingCall()
        const isTypingCallPromise = new Promise((resolve) => {
          isTypingCall.on('replied', () => {
            if (isTypingCall.isDone()) {
              resolve()
            }
          })
        })
        const messageCall = nock(facebookAPI).post('/v2.11/me/messages', (requestBody) => {
          const parsed = qs.parse(requestBody)
          // https://developers.facebook.com/docs/messenger-platform/send-messages/template/list
          const expectedQuery = {
            access_token: channelCreationParams.token,
            appsecret_proof: 'a0db4e58b0b2a5434a6f95e1ed797f311e42feee3c71f7c6f057a649ef1a8291',
            messaging_type: 'RESPONSE',
            recipient: { id: `${senderId}` },
            message: {
              attachment: {
                type: 'template',
                payload: {
                  template_type: 'generic',
                  elements: [{
                    title: cardElement.title,
                    subtitle: cardElement.subtitle,
                    image_url: cardElement.imageUrl,
                    buttons: {
                      // '[0][title]': cardElement.buttons[0].title,
                      '[0][type]': 'text',
                    },
                  }],
                },
              },
            },
          }
          return _.isEqual(expectedQuery, parsed)
        }).query(true).reply(200, {})
        const messageCallPromise = new Promise((resolve) => {
          messageCall.on('replied', () => {
            if (messageCall.isDone()) {
              resolve()
            }
          })
        })
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'card', content: cardElement }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
        return Promise.all([isTypingCallPromise, messageCallPromise])
      })

      it('in carousel format', async () => {
        const carouselElement = {
          title: 'title',
          imageUrl: 'https://img.url',
          buttons: [{ type: '', title: 'button title', value: 'abc' }],
        }
        const isTypingCall = mockIsTypingCall()
        const isTypingCallPromise = new Promise((resolve) => {
          isTypingCall.on('replied', () => {
            if (isTypingCall.isDone()) {
              resolve()
            }
          })
        })
        const messageCall = nock(facebookAPI).post('/v2.11/me/messages', (requestBody) => {
          const parsed = qs.parse(requestBody)
          // https://developers.facebook.com/docs/messenger-platform/send-messages/template/list
          const expectedQuery = {
            access_token: channelCreationParams.token,
            appsecret_proof: 'a0db4e58b0b2a5434a6f95e1ed797f311e42feee3c71f7c6f057a649ef1a8291',
            messaging_type: 'RESPONSE',
            recipient: { id: `${senderId}` },
            message: {
              attachment: {
                type: 'template',
                payload: {
                  template_type: 'generic',
                  elements: [{
                    title: carouselElement.title,
                    image_url: carouselElement.imageUrl,
                    buttons: {
                      // '[0][title]': carouselElement.buttons[0].title,
                      '[0][type]': 'text',
                    },
                  }],
                },
              },
            },
          }
          return _.isEqual(expectedQuery, parsed)
        }).query(true).reply(200, {})
        const messageCallPromise = new Promise((resolve) => {
          messageCall.on('replied', () => {
            if (messageCall.isDone()) {
              resolve()
            }
          })
        })
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'carousel', content: [carouselElement] }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
        return Promise.all([isTypingCallPromise, messageCallPromise])
      })

      it('in quickReplies format', async () => {
        const quickReplies = {
          title: 'title',
          buttons: [
            { type: '', title: 'button title', value: 'abc' },
            { type: 'postback', title: '1991 - 1996', value: '1991 - 1996' },
          ],
        }
        const isTypingCall = mockIsTypingCall()
        const isTypingCallPromise = new Promise((resolve) => {
          isTypingCall.on('replied', () => {
            if (isTypingCall.isDone()) {
              resolve()
            }
          })
        })
        const messageCall = nock(facebookAPI).post('/v2.11/me/messages', (requestBody) => {
          const parsed = qs.parse(requestBody)
          // https://developers.facebook.com/docs/messenger-platform/send-messages/template/list
          const expectedQuery = {
            access_token: channelCreationParams.token,
            appsecret_proof: 'a0db4e58b0b2a5434a6f95e1ed797f311e42feee3c71f7c6f057a649ef1a8291',
            messaging_type: 'RESPONSE',
            recipient: { id: `${senderId}` },
            message: {
              text: quickReplies.title,
              quick_replies: [
                {
                  content_type: 'text',
                  title: quickReplies.buttons[0].title,
                  payload: quickReplies.buttons[0].value,
                },
                {
                  content_type: 'text',
                  title: quickReplies.buttons[1].title,
                  payload: quickReplies.buttons[1].value,
                },
              ],
            },
          }
          return _.isEqual(expectedQuery, parsed)
        }).query(true).reply(200, {})
        const messageCallPromise = new Promise((resolve) => {
          messageCall.on('replied', () => {
            if (messageCall.isDone()) {
              resolve()
            }
          })
        })
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'quickReplies', content: quickReplies }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
        return Promise.all([isTypingCallPromise, messageCallPromise])
      })

      it('in video format', async () => {
        const videoLink = 'https://link.com'
        const isTypingCall = mockIsTypingCall()
        const isTypingCallPromise = new Promise((resolve) => {
          isTypingCall.on('replied', () => {
            if (isTypingCall.isDone()) {
              resolve()
            }
          })
        })
        const messageCall = nock(facebookAPI).post('/v2.11/me/messages', (requestBody) => {
          const parsed = qs.parse(requestBody)
          // https://developers.facebook.com/docs/messenger-platform/send-messages/template/list
          const expectedQuery = {
            access_token: channelCreationParams.token,
            appsecret_proof: 'a0db4e58b0b2a5434a6f95e1ed797f311e42feee3c71f7c6f057a649ef1a8291',
            messaging_type: 'RESPONSE',
            recipient: { id: `${senderId}` },
            message: {
              attachment: {
                type: 'video',
                payload: { url: videoLink },
              },
            },
          }
          return _.isEqual(expectedQuery, parsed)
        }).query(true).reply(200, {})
        const messageCallPromise = new Promise((resolve) => {
          messageCall.on('replied', () => {
            if (messageCall.isDone()) {
              resolve()
            }
          })
        })
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'video', content: videoLink }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
        return Promise.all([isTypingCallPromise, messageCallPromise])
      })

      it('in buttons format', async () => {
        const buttonsElement = {
          title: 'title',
          buttons: [{ type: 'text', title: 'button title', value: 'abc' }],
        }
        const isTypingCall = mockIsTypingCall()
        const isTypingCallPromise = new Promise((resolve) => {
          isTypingCall.on('replied', () => {
            if (isTypingCall.isDone()) {
              resolve()
            }
          })
        })
        const messageCall = nock(facebookAPI).post('/v2.11/me/messages', (requestBody) => {
          const parsed = qs.parse(requestBody)
          // https://developers.facebook.com/docs/messenger-platform/send-messages/template/list
          const expectedQuery = {
            access_token: channelCreationParams.token,
            appsecret_proof: 'a0db4e58b0b2a5434a6f95e1ed797f311e42feee3c71f7c6f057a649ef1a8291',
            messaging_type: 'RESPONSE',
            recipient: { id: `${senderId}` },
            message: {
              attachment: {
                type: 'template',
                payload: {
                  template_type: 'button',
                  text: buttonsElement.title,
                  buttons: [{
                    type: 'text',
                  }],
                },
              },
            },
          }
          return _.isEqual(expectedQuery, parsed)
        }).query(true).reply(200, {})
        const messageCallPromise = new Promise((resolve) => {
          messageCall.on('replied', () => {
            if (messageCall.isDone()) {
              resolve()
            }
          })
        })
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'buttons', content: buttonsElement }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
        return Promise.all([isTypingCallPromise, messageCallPromise])
      })
    })

  })
})
