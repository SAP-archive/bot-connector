import expect from 'expect.js'
import should from 'should'
import superagent from 'superagent'
import superagentPromise from 'superagent-promise'

import channelFactory from '../factories/Channel'
import connectorFactory from '../factories/Connector'
import conversationFactory from '../factories/Conversation'
import messageFactory from '../factories/Message'
import participantFactory from '../factories/Participant'
import nock from 'nock'
import '../util/start_application'
import { Participant, Connector, Channel, Message, Conversation } from '../../src/models'

const agent = superagentPromise(superagent, Promise)

const expectPollResult = (res, messages) => {
  const { results, message } = res.body
  expect(res.status).to.be(200)
  expect(message).to.be(`${messages.length} messages`)
  expect(results.waitTime).to.be(0)
  expect(results.messages.length).to.be(messages.length)
  results.messages.forEach((msg, ind) => {
    const expected = messages[ind]
    expect(msg.attachment.content).to.be(expected)
    expect(typeof msg.participant).to.be('object')
  })
}

const sendUserMessage = (channel, conversation, text) => {
  return agent.post(`${process.env.ROUTETEST}/v1/webhook/${channel._id}`)
    .send({ chatId: conversation.chatId, message: { attachment: { type: 'text', content: text } } })
}

const sendBotMessages = (conversation, msgs) => {
  return agent.post(`${process.env.ROUTETEST}/v1/connectors/${conversation.connector._id}/conversations/${conversation._id}/messages`)
    .send({ messages: msgs.map(m => ({ type: 'text', content: m })) })
}

const pollConversation = (channel, conversation, last_message_id) => {
  let pollUrl = `${process.env.ROUTETEST}/v1/webhook/${channel._id}/conversations/${conversation._id}/poll`
  if (last_message_id) {
    pollUrl += `?last_message_id=${last_message_id}`
  }
  return agent.get(pollUrl)
    .set({ Authorization: channel.token })
    .send()
}

describe('Webhooks Controller Testing', () => {
  afterEach(async () => {
    Promise.all([
      Connector.remove(),
      Channel.remove(),
      Conversation.remove(),
      Message.remove(),
      Participant.remove(),
    ])
  })

  describe('POST forwardMessage', () => {
    it('should 200 with a valid message', async () => {
      const connector = await connectorFactory.build()
      nock(connector.url).post('/').reply(200, {})
      const channel = await channelFactory.build(connector, { isActivated: true })
      const res = await agent.post(`${process.env.ROUTETEST}/v1/webhook/${channel._id}`)
        .send({
          chatId: 123,
          message: { attachment: { type: 'text', content: { value: 'a message' } } },
        })

      expect(res.status).to.be(200)
    })

    it('should 400 with a deactivated channel', async () => {
      try {
        const connector = await connectorFactory.build()
        const channel = await channelFactory.build(connector, { isActivated: false })
        await agent.post(`${process.env.ROUTETEST}/v1/webhook/${channel._id}`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(400)
        expect(message).to.be('Channel is not activated')
        expect(results).to.be(null)
      }
    })

    it('should 404 without a channel', async () => {
      try {
        await agent.post(`${process.env.ROUTETEST}/v1/webhook/lol`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Channel not found')
        expect(results).to.be(null)
      }
    })
  })

  describe('GET subscribeWebhook', () => {
    it('should 400 with an invalid webhook', async () => {
      try {
        const connector = await connectorFactory.build()
        const channel = await channelFactory.build(connector, { isActivated: false })
        await agent.get(`${process.env.ROUTETEST}/v1/webhook/${channel._id}`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(400)
        expect(message).to.be('Unimplemented service method')
        expect(results).to.be(null)
      }
    })

    it('should 404 without a channel', async () => {
      try {
        await agent.get(`${process.env.ROUTETEST}/v1/webhook/lol`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Channel not found')
        expect(results).to.be(null)
      }
    })
  })

  describe('POST createConversation', () => {
    it('should 200 with a valid channel token', async () => {
      const connector = await connectorFactory.build()
      const channel = await channelFactory.build(connector)
      const res = await agent.post(`${process.env.ROUTETEST}/v1/webhook/${channel._id}/conversations`)
        .set({ Authorization: channel.token })
        .send({ messages: [{ type: 'text', content: 'yolo' }] })
      const { message } = res.body

      expect(res.status).to.be(201)
      expect(message).to.be('Conversation successfully created')
    })

    it('should 401 with an invalid channel token', async () => {
      try {
        const connector = await connectorFactory.build()
        const channel = await channelFactory.build(connector)
        await agent.post(`${process.env.ROUTETEST}/v1/webhook/${channel._id}/conversations`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(401)
        expect(message).to.be('Request can not be processed with your role')
        expect(results).to.be(null)
      }
    })

    it('should 400 with an invalid channel type', async () => {
      try {
        const connector = await connectorFactory.build()
        const channel = await channelFactory.build(connector, { type: 'slack' })
        await agent.post(`${process.env.ROUTETEST}/v1/webhook/${channel._id}/conversations`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(400)
        expect(message).to.be('Invalid channel type')
        expect(results).to.be(null)
      }
    })

    it('should 404 without a channel', async () => {
      try {
        await agent.post(`${process.env.ROUTETEST}/v1/webhook/invalid_id/conversations`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Channel not found')
        expect(results).to.be(null)
      }
    })
  })

  describe('GET getMessages', () => {
    it('should 200 with a valid channel token', async () => {
      const connector = await connectorFactory.build()
      const channel = await channelFactory.build(connector)
      const conversation = await conversationFactory.build(connector, channel)
      const participant = await participantFactory.build(conversation)
      await messageFactory.build(conversation, participant)
      await messageFactory.build(conversation, participant)
      const response = await agent.get(`${process.env.ROUTETEST}/v1/webhook/${channel._id}/conversations/${conversation._id}/messages`)
        .set({ Authorization: channel.token })
        .send()

      expect(response.status).to.be(200)
      expect(response.body.message).to.be('Messages successfully fetched')
      expect(response.body.results).to.have.length(2)
    })

    it('should 404 with wrong channel', async () => {
      const connector = await connectorFactory.build()
      const channel = await channelFactory.build(connector)
      const conversation = await conversationFactory.build(connector, channel)

      try {
        await agent.get(`${process.env.ROUTETEST}/v1/webhook/randomWrongId/conversations/${conversation._id}/messages`)
          .set({ Authorization: channel.token })
          .send()
      } catch (err) {
        expect(err.status).to.be(404)
        expect(err.response.body.message).to.be('Channel not found')
        expect(err.response.body.results).to.be(null)
      }
    })

    it('should 404 with wrong conversation', async () => {
      const connector = await connectorFactory.build()
      const channel = await channelFactory.build(connector)

      try {
        await agent.get(`${process.env.ROUTETEST}/v1/webhook/${channel._id}/conversations/randomWrongId/messages`)
          .set({ Authorization: channel.token })
          .send()
      } catch (err) {
        expect(err.status).to.be(404)
        expect(err.response.body.message).to.be('Conversation not found')
        expect(err.response.body.results).to.be(null)
      }
    })

    it('should 401 without token', async () => {
      const connector = await connectorFactory.build()
      const channel = await channelFactory.build(connector)
      const conversation = await conversationFactory.build(connector, channel)

      try {
        await agent.get(`${process.env.ROUTETEST}/v1/webhook/${channel._id}/conversations/${conversation._id}/messages`)
        expect().fail('should have failed because of missing token')
      } catch (err) {
        if (!err.status) { throw err }
        expect(err.status).to.be(401)
        expect(err.response.body.message).to.be('Request can not be processed with your role')
        expect(err.response.body.results).to.be(null)
      }
    })

    it('should fail with wrong token', async () => {
      const connector = await connectorFactory.build()
      const channel = await channelFactory.build(connector)
      const otherChannel = await channelFactory.build(connector)
      const conversation = await conversationFactory.build(connector, channel)

      try {
        await agent.get(`${process.env.ROUTETEST}/v1/webhook/${channel._id}/conversations/${conversation._id}/messages`)
          .set({ Authorization: otherChannel.token })
          .send()

        expect().fail('should have failed because of wrong token')
      } catch (err) {
        if (!err.status) { throw err }
        expect(err.status).to.be(401)
        expect(err.response.body.message).to.be('Request can not be processed with your role')
        expect(err.response.body.results).to.be(null)
      }
    })
  })

  describe('GET preferences', () => {
    after(async () => {
      await Promise.all([
        Connector.remove(),
        Channel.remove(),
      ])
    })

    it('should 200 and return preferences', async () => {
      const connector = await connectorFactory.build()
      const preferences = {
        accentColor: '#000000',
        complementaryColor: '#100000',
        botMessageColor: '#200000',
        botMessageBackgroundColor: '#300000',
        backgroundColor: '#400000',
        headerLogo: '#500000',
        headerTitle: '#600000',
        botPicture: '#700000',
        userPicture: '#800000',
        onboardingMessage: '#900000',
        expanderLogo: '#110000',
        expanderTitle: '#120000',
        conversationTimeToLive: 12,
        characterLimit: 42,
        userInputPlaceholder: 'Write a reply',
      }
      const channel = await channelFactory.build(connector, { type: 'webchat', ...preferences })

      const res = await agent.get(`${process.env.ROUTETEST}/v1/webhook/${channel._id}/preferences`)
        .set({ Authorization: channel.token })
        .send()
      const { results, message } = res.body
      expect(res.status).to.be(200)
      expect(message).to.be('Preferences successfully rendered')
      expect(results.accentColor).to.be(preferences.accentColor)
      expect(results.complementaryColor).to.be(preferences.complementaryColor)
      expect(results.botMessageColor).to.be(preferences.botMessageColor)
      expect(results.botMessageBackgroundColor).to.be(preferences.botMessageBackgroundColor)
      expect(results.backgroundColor).to.be(preferences.backgroundColor)
      expect(results.headerLogo).to.be(preferences.headerLogo)
      expect(results.headerTitle).to.be(preferences.headerTitle)
      expect(results.botPicture).to.be(preferences.botPicture)
      expect(results.userPicture).to.be(preferences.userPicture)
      expect(results.onboardingMessage).to.be(preferences.onboardingMessage)
      expect(results.expanderLogo).to.be(preferences.expanderLogo)
      expect(results.expanderTitle).to.be(preferences.expanderTitle)
      expect(results.conversationTimeToLive).to.be(preferences.conversationTimeToLive)
      expect(results.characterLimit).to.be(preferences.characterLimit)
    })

    it('should 401 with an invalid channel token', async () => {
      try {
        const connector = await connectorFactory.build()
        const preferences = {}
        const channel = await channelFactory.build(connector, { type: 'webchat', ...preferences })
        await agent.get(`${process.env.ROUTETEST}/v1/webhook/${channel._id}/preferences`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(401)
        expect(message).to.be('Request can not be processed with your role')
        expect(results).to.be(null)
      }
    })

    it('should fail for wrong channel type (other than webchat)')

    it('should 404 with non-existing channel', async () => {
      try {
        const connector = await connectorFactory.build()
        const preferences = {}
        const channel = await channelFactory.build(connector, { type: 'webchat', ...preferences })
        await agent.get(`${process.env.ROUTETEST}/v1/webhook/non-existing/preferences`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Channel not found')
        expect(results).to.be(null)
      }
    })
  })

  describe('GET poll', () => {

    let connector
    beforeEach(async () => {
      connector = await connectorFactory.build()
      nock(connector.url).post('/').reply(200, {})
    })

    afterEach(async () => {
      await Promise.all([
        Connector.remove(),
        Channel.remove(),
        Conversation.remove(),
      ])
    })

    it('should 200 and return immediately with existing messages', async () => {
      const channel = await channelFactory.build(connector, { type: 'webchat' })
      const conversation = await conversationFactory.build(connector, channel)

      await sendUserMessage(channel, conversation, 'yolo')
      nock(connector.url).post('/').reply(200, {})
      await sendUserMessage(channel, conversation, 'lolz')
      await new Promise((resolve) => setTimeout(resolve, 200))

      const res = await pollConversation(channel, conversation)
      expectPollResult(res, ['yolo', 'lolz'])
    })

    it('should 200 and return new incoming message from user', async () => {
      const channel = await channelFactory.build(connector, { type: 'webchat' })
      const conversation = await conversationFactory.build(connector, channel)

      await sendUserMessage(channel, conversation, 'yolo')

      // make sure we receive old messages first
      const res = await pollConversation(channel, conversation)
      expectPollResult(res, ['yolo'])
      const last_message_id = res.body.results.messages[0].id

      nock(connector.url).post('/').reply(200, {})
      await sendUserMessage(channel, conversation, 'haha')

      const res2 = await pollConversation(channel, conversation, last_message_id)
      expectPollResult(res2, ['haha'])
    })

    it('should 200 and return new incoming message from bot', async () => {
      const channel = await channelFactory.build(connector, { type: 'webchat' })
      const conversation = await conversationFactory.build(connector, channel)

      await sendUserMessage(channel, conversation, 'yolo')

      // make sure we receive old messages first
      const res = await pollConversation(channel, conversation)
      expectPollResult(res, ['yolo'])
      const last_message_id = res.body.results.messages[0].id

      await sendBotMessages(conversation, ['megalol'])

      const res2 = await pollConversation(channel, conversation, last_message_id)
      expectPollResult(res2, ['megalol'])
    })

    it('should 200 and return new incoming messages from bot and user', async () => {
      const channel = await channelFactory.build(connector, { type: 'webchat' })
      const conversation = await conversationFactory.build(connector, channel)

      await sendUserMessage(channel, conversation, 'lool')

      const res = await pollConversation(channel, conversation)
      expectPollResult(res, ['lool'])
      const last_message_id = res.body.results.messages[0].id

      setTimeout(async () => { await sendBotMessages(conversation, ['mdr', 'ptdr']) }, 300)

      const res2 = await pollConversation(channel, conversation, last_message_id)
      expectPollResult(res2, ['mdr'])
      const last_message_id2 = res2.body.results.messages[0].id

      const res3 = await pollConversation(channel, conversation, last_message_id2)
      expectPollResult(res3, ['ptdr'])
    })

    it('should 200 and forward conversation start', async () => {
      const channel = await channelFactory.build(connector, {
        type: 'webchat',
        forwardConversationStart: true,
      })
      nock(connector._doc.url).post('/').reply(200, { results: {}, message: 'Success' })
      const res = await agent.post(`${process.env.ROUTETEST}/v1/webhook/${channel._id}/conversations`)
        .set({ Authorization: channel.token })
        .send()
      const conversation = res.body.results
      conversation._id = conversation.id

      const res2 = await pollConversation(channel, conversation)
      expectPollResult(res2, [''])
    })

    it('should ??? if conversation start fails')

    it('should not return when no message arrives', async () => {
      const channel = await channelFactory.build(connector, { type: 'webchat' })
      const conversation = await conversationFactory.build(connector, channel)

      let over = false
      pollConversation(channel, conversation).end(() => { over = true })
      await new Promise((resolve) => setTimeout(resolve, 600))
      expect(over).to.be(false)
    })

    it('should 401 with an invalid channel token', async () => {
      try {
        const channel = await channelFactory.build(connector)
        const conversation = await conversationFactory.build(connector, channel)
        await agent.get(`${process.env.ROUTETEST}/v1/webhook/${channel._id}/conversations/${conversation._id}/poll`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(401)
        expect(message).to.be('Request can not be processed with your role')
        expect(results).to.be(null)
      }
    })

    it('should 400 for invalid channel type', async () => {
      const channel = await channelFactory.build(connector, { type: 'slackapp' })
      const conversation = await conversationFactory.build(connector, channel)

      try {
        await agent.get(`${process.env.ROUTETEST}/v1/webhook/${channel._id}/conversations/${conversation._id}/poll`)
          .set({ Authorization: channel.token })
          .send()

        expect().fail()
      } catch (err) {
        if (!err.status) { throw err }
        expect(err.status).to.be(400)
        expect(err.response.body.message).to.be('Invalid channel type')
      }
    })

    it('should 404 with non-existing channel', async () => {
      try {
        const channel = await channelFactory.build(connector)
        const conversation = await conversationFactory.build(connector, channel)
        await agent.get(`${process.env.ROUTETEST}/v1/webhook/not_existing/conversations/${conversation._id}/poll`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Channel not found')
        expect(results).to.be(null)
      }
    })

    it('should fail for non-existing conversation')

    it('should 404 with non-existing last_message', async () => {
      try {
        const channel = await channelFactory.build(connector)
        const conversation = await conversationFactory.build(connector, channel)
        await agent.get(`${process.env.ROUTETEST}/v1/webhook/${channel._id}/conversations/${conversation._id}/poll?last_message_id=non-existing`)
          .set({ Authorization: channel.token })
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Message not found')
        expect(results).to.be(null)
      }
    })
  })

})
