import expect from 'expect.js'
import should from 'should'
import superagent from 'superagent'
import superagentPromise from 'superagent-promise'
import '../util/start_application'
import config from '../../config/test'
import channelFacto from '../factories/Channel'
import connectorFacto from '../factories/Connector'
import conversationFacto from '../factories/Conversation'
import { Connector, Channel, Conversation } from '../../src/models'

const agent = superagentPromise(superagent, Promise)

let connector = null
let channel = null
let conversation = null

describe('Conversations controller', () => {
  after(async () => {
    await Promise.all([
      Conversation.remove(),
      Connector.remove(),
      Channel.remove(),
    ])
  })

  // Index conversations

  describe('GET', () => {
    afterEach(async () => {
      await Promise.all([
        Conversation.remove(),
        Connector.remove(),
        Channel.remove(),
      ])
    })

    it('should 200 with conversations', async () => {
      connector = await connectorFacto.build()
      channel = await channelFacto.build(connector)
      conversation = await conversationFacto.build(connector, channel)

      const res = await agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/conversations`)
        .send()
      const { results, message } = res.body

      expect(res.status).to.be(200)
      expect(message).to.be('Conversations successfully found')
      expect(results.length).to.be(1)
      expect(results[0].id).to.equal(conversation._id)
    })

    it('should 200 without conversations', async () => {
      connector = await connectorFacto.build()
      channel = await channelFacto.build(connector)

      const res = await agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/conversations`)
        .send()
      const { results, message } = res.body

      expect(res.status).to.be(200)
      expect(message).to.be('No conversations')
      expect(results.length).to.be(0)
    })

    it('should 404 without connector', async () => {
      try {
        await agent.get(`${process.env.ROUTETEST}/v1/connectors/dec04e80-424d-4a9f-bb80-6d40511e246b/conversations`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Connector not found')
        expect(results).to.be(null)
      }
    })
  })

  // Show a conversation

  describe('GET', () => {
    afterEach(async () => {
      await Promise.all([
        Conversation.remove(),
        Connector.remove(),
        Channel.remove(),
      ])
    })

    it('should 200 with a conversation', async () => {
      connector = await connectorFacto.build()
      channel = await channelFacto.build(connector)
      conversation = await conversationFacto.build(connector, channel)

      const res = await agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/conversations/${conversation._id}`)
        .send()
      const { results, message } = res.body

      expect(res.status).to.be(200)
      expect(message).to.be('Conversation successfully found')
      expect(results.id).to.equal(conversation._id)
    })

    it('should 404 without a conversation', async () => {
      try {
        connector = await connectorFacto.build()
        await agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/conversations/invalid_id`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Conversation not found')
        expect(results).to.be(null)
      }
    })

    it('should 404 without connector', async () => {
      try {
        await agent.get(`${process.env.ROUTETEST}/v1/connectors/dec04e80-424d-4a9f-bb80-6d40511e246/conversations/invalid_id`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Connector not found')
        expect(results).to.be(null)
      }
    })
  })

  // Delete a conversation

  describe('DELETE', () => {
    afterEach(async () => {
      await Promise.all([
        Connector.remove(),
        Channel.remove(),
        Conversation.remove(),
      ])
    })

    it('should 200 with a conversation', async () => {
      connector = await connectorFacto.build()
      channel = await channelFacto.build(connector)
      conversation = await conversationFacto.build(connector, channel)

      const res = await agent.del(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/conversations/${conversation._id}`)
        .send()
      const { results, message } = res.body

      expect(res.status).to.be(200)
      expect(message).to.be('Conversation successfully deleted')
      expect(results).to.equal(null)
    })

    it('should 404 without a conversation', async () => {
      try {
        connector = await connectorFacto.build()
        await agent.del(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/conversations/invalid_id`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Conversation not found')
        expect(results).to.be(null)
      }
    })

    it('should 404 without a connector', async () => {
      try {
        await agent.del(`${process.env.ROUTETEST}/v1/connectors/dec04e80-424d-4a9f-bb80-6d40511e246/conversations/invalid_id`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Connector not found')
        expect(results).to.be(null)
      }
    })
  })

})

