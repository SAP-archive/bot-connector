import _ from 'lodash'
import chai from 'chai'
import { setupChannelIntegrationTests } from '../../../../test/tools'
import superagentPromise from 'superagent-promise'
import superagent from 'superagent'
import nock from 'nock'

/* eslint max-nested-callbacks: 0 */  // --> OFF
/* eslint no-unused-expressions: 0 */  // --> OFF

const agent = superagentPromise(superagent, Promise)
const expect = chai.expect

describe('Slack channel', () => {

  const { createChannel, sendMessageToWebhook } = setupChannelIntegrationTests()
  let slackAppChannel
  const teamId = 'slack-team'

  beforeEach(async () => {
    const response = await createChannel({
      type: 'slackapp',
      slug: 'my-awesome-channel',
      clientId: 'client-id',
      clientSecret: 'client-secret',
    })
    slackAppChannel = response.body.results
  })

  describe('Creation', () => {
    it('should be successful with valid parameters', async () => {
      const slackOauthResponse = {
        ok: true,
        team_id: teamId,
        bot: {
          bot_user_id: 'bot-user-id',
          bot_access_token: 'bot-access-token',
        },
      }
      nock('https://slack.com').post('/api/oauth.access').query(true).reply(200, slackOauthResponse)

      // Call oauth endpoint on Slack App channel to create Slack channel
      const oauthResponse = await agent.get(slackAppChannel.oAuthUrl)
        .query({ code: 'activation-code' })
        .send({})
      expect(oauthResponse.status).to.equal(200)
      // Get Slack App channel and check for child
      const createChannelResponse
        = await agent.get(`${process.env.ROUTETEST}/v1/connectors/${slackAppChannel.connector}/channels/${slackAppChannel.slug}`)
        .send()
      expect(createChannelResponse.status).to.equal(200)
      expect(createChannelResponse.body.results.children).to.have.lengthOf(1)
      const slackChannel = createChannelResponse.body.results.children[0]
      expect(slackChannel.botuser).to.equal(slackOauthResponse.bot.bot_user_id)
      expect(slackChannel.token).to.equal(slackOauthResponse.bot.bot_access_token)
    })
  })

  describe('sending a message', () => {

    const botUser = 'W965F80RL'
    const botAccessToken = 'bot-access-token'
    const teamId = 'T78N3DCEN'

    beforeEach(async () => {
      nock('https://slack.com').post('/api/oauth.access').query(true).reply(200, {
        ok: true,
        team_id: teamId,
        bot: {
          bot_user_id: botUser,
          bot_access_token: botAccessToken,
        },
      })
      nock('http://slack.com').get('/api/users.info').query(true).reply(200, {})

      // Call oauth endpoint on Slack App channel to create Slack channel
      await agent.get(slackAppChannel.oAuthUrl)
        .query({ code: 'activation-code' })
        .send({ })
    })

    const body = {
      token: 'NIQiZjUhWLD9dAw54YcZbf9X',
      team_id: teamId,
      enterprise_id: 'A1RABCDXHA',
      api_app_id: 'BABTW7MNU',
      event: {
        type: 'message',
        user: 'another-user',
        text: 'This is a test message',
        client_msg_id: '2ca5568c-1ae6-4446-9419-a1f388d3289b',
        team: teamId,
        source_team: teamId,
        user_team: teamId,
        user_profile: {
          avatar_hash: '5ab7b65c4c14',
          image_72: 'https://avatars.slack-edge.com/2018-03-13'
          + '/335522214727_5ab6b74c4c132402f9ba_72.jpg',
          first_name: 'John',
          real_name: 'John Doe',
          display_name: 'John Doe',
          team: 'E7RBBBXHB',
          name: 'johndoe',
          is_restricted: false,
          is_ultra_restricted: false,
        },
        ts: '1531523342.000005',
        channel: 'DAPTXDG92',
        event_ts: '1531523342.000005',
        channel_type: 'im',
      },
      type: 'event_callback',
      authed_teams: [teamId],
      event_id: 'EvBRPDDKU6',
      event_time: 1531523342,
      authed_users: ['WAPTX8GTA'],
    }

    describe('should be successful', () => {
      it('in text format', async () => {
        const message = 'my text message'
        const apiCall = nock('https://slack.com').post('/api/chat.postMessage')
          .query((actualQuery) => {
            const expectedQuery = {
              token: botAccessToken,
              as_user: 'true',
              channel: body.event.channel,
              text: message,
            }
            return _.isEqual(expectedQuery, actualQuery)
          })
          .reply(200, {
            ok: true,
          })
        const botResponse = {
          messages: JSON.stringify([{ type: 'text', content: message }]),
        }
        const response = await sendMessageToWebhook(slackAppChannel, body, {}, botResponse)
        expect(response.status).to.equal(200)
        expect(apiCall.isDone()).to.be.true
      })

      it('in list format', async () => {
        const listElement = {
          title: 'title',
          subtitle: 'subtitle',
          imageUrl: 'https://img.url',
          buttons: [{ type: '', title: 'button title', value: 'abc' }],
        }
        const apiCall = nock('https://slack.com').post('/api/chat.postMessage')
          .query((actualQuery) => {
            actualQuery.attachments = JSON.parse(actualQuery.attachments)
            const expectedQuery = {
              token: botAccessToken,
              as_user: 'true',
              channel: body.event.channel,
              attachments: [{
                color: '#3AA3E3',
                attachment_type: 'default',
                callback_id: 'callback_id',
                title: listElement.title,
                image_url: listElement.imageUrl,
                text: listElement.subtitle,
                actions: [{
                  name: listElement.buttons[0].title,
                  text: listElement.buttons[0].title,
                  type: 'button',
                  value: listElement.buttons[0].value,
                }],
              }],
            }
            return _.isEqual(expectedQuery, actualQuery)
          })
          .reply(200, {
            ok: true,
          })
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'list', content: { elements: [listElement] } }]),
        }
        const response = await sendMessageToWebhook(slackAppChannel, body, {}, botResponse)
        expect(response.status).to.equal(200)
        expect(apiCall.isDone()).to.be.true
      })

      it('in card format', async () => {
        const cardElement = {
          title: 'title',
          subtitle: 'subtitle',
          imageUrl: 'https://img.url',
          buttons: [{ type: '', title: 'button title', value: 'abc' }],
        }
        const apiCall = nock('https://slack.com').post('/api/chat.postMessage')
          .query((actualQuery) => {
            actualQuery.attachments = JSON.parse(actualQuery.attachments)
            const expectedQuery = {
              token: botAccessToken,
              as_user: 'true',
              channel: body.event.channel,
              attachments: [{
                color: '#7CD197',
                fallback: cardElement.title,
                attachment_type: 'default',
                callback_id: 'callback_id',
                title: cardElement.title,
                image_url: cardElement.imageUrl,
                text: cardElement.subtitle,
                actions: [{
                  name: cardElement.buttons[0].title,
                  text: cardElement.buttons[0].title,
                  type: 'button',
                  value: cardElement.buttons[0].value,
                }],
              }],
            }
            return _.isEqual(expectedQuery, actualQuery)
          })
          .reply(200, {
            ok: true,
          })
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'card', content: cardElement }]),
        }
        const response = await sendMessageToWebhook(slackAppChannel, body, {}, botResponse)
        expect(response.status).to.equal(200)
        expect(apiCall.isDone()).to.be.true
      })

      it('in carousel format', async () => {
        const carouselElement = {
          title: 'title',
          imageUrl: 'https://img.url',
          buttons: [{ type: '', title: 'button title', value: 'abc' }],
        }
        const apiCall = nock('https://slack.com').post('/api/chat.postMessage')
          .query((actualQuery) => {
            actualQuery.attachments = JSON.parse(actualQuery.attachments)
            const expectedQuery = {
              token: botAccessToken,
              as_user: 'true',
              channel: body.event.channel,
              attachments: [{
                color: '#F35A00',
                attachment_type: 'default',
                callback_id: 'callback_id',
                title: carouselElement.title,
                image_url: carouselElement.imageUrl,
                actions: [{
                  name: carouselElement.buttons[0].title,
                  text: carouselElement.buttons[0].title,
                  type: 'button',
                  value: carouselElement.buttons[0].value,
                }],
              }],
            }
            return _.isEqual(expectedQuery, actualQuery)
          })
          .reply(200, {
            ok: true,
          })
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'carousel', content: [carouselElement] }]),
        }
        const response = await sendMessageToWebhook(slackAppChannel, body, {}, botResponse)
        expect(response.status).to.equal(200)
        expect(apiCall.isDone()).to.be.true
      })

      it('in buttons', async () => {
        const buttonsElement = {
          title: 'title',
          buttons: [{ type: '', title: 'button title', value: 'abc' }],
        }
        const apiCall = nock('https://slack.com').post('/api/chat.postMessage')
          .query((actualQuery) => {
            actualQuery.attachments = JSON.parse(actualQuery.attachments)
            const expectedQuery = {
              token: botAccessToken,
              as_user: 'true',
              channel: body.event.channel,
              text: buttonsElement.title,
              attachments: [{
                fallback: buttonsElement.title,
                color: '#3AA3E3',
                attachment_type: 'default',
                callback_id: 'callback_id',
                actions: [{
                  name: buttonsElement.buttons[0].title,
                  text: buttonsElement.buttons[0].title,
                  type: 'button',
                  value: buttonsElement.buttons[0].value,
                }],
              }],
            }
            return _.isEqual(expectedQuery, actualQuery)
          })
          .reply(200, {
            ok: true,
          })
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'buttons', content: buttonsElement }]),
        }
        const response = await sendMessageToWebhook(slackAppChannel, body, {}, botResponse)
        expect(response.status).to.equal(200)
        expect(apiCall.isDone()).to.be.true
      })

      it('with response message type picture', async () => {
        const imageUrl = 'https://url.to/image.png'
        const apiCall = nock('https://slack.com')
          .post('/api/chat.postMessage')
          .query((actualQuery) => {
            actualQuery.attachments = JSON.parse(actualQuery.attachments)
            const expectedQuery = {
              token: botAccessToken,
              as_user: 'true',
              channel: body.event.channel,
              attachments: [{
                fallback: imageUrl,
                image_url: imageUrl,
              }],
            }
            return _.isEqual(expectedQuery, actualQuery)
          })
          .reply(200, {
            ok: true,
          })

        const botResponse = {
          results: {},
          messages: JSON.stringify([
            {
              type: 'picture',
              content: imageUrl,
            },
          ]),
        }
        const response = await sendMessageToWebhook(slackAppChannel, body, {}, botResponse)
        expect(response.status).to.equal(200)
        expect(apiCall.isDone()).to.be.true
      })
    })

  })
})
