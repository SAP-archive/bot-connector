import expect from 'expect.js'
import should from 'should'
import superagent from 'superagent'
import superagentPromise from 'superagent-promise'

import config from '../../config'
import channelFactory from '../factories/channel'
import connectorFactory from '../factories/connector'
import { Connector, Channel } from '../../src/models'
import '../util/start_application'
const agent = superagentPromise(superagent, Promise)

let connector = null
let channel = null

describe('Channels Controller', () => {
  after(async () => {
    await Connector.remove()
    await Channel.remove()
  })

  // Channel Creation

  describe('Create', () => {
    afterEach(async () => {
      await Promise.all([
        Connector.remove(),
        Channel.remove(),
      ])
    })

    it('should 200 with valid parameters', async () => {
      connector = await connectorFactory.build()
      const payload = { type: 'recastwebchat', slug: 'my-awesome-channel' }
      const res = await agent.post(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/channels`)
        .send(payload)
      const { results, message } = res.body

      expect(res.status).to.be(201)
      expect(message).to.be('Channel successfully created')
      expect(results.type).to.be(payload.type)
      expect(results.slug).to.be(payload.slug)
    })

    it('should 400 with missing type', async () => {
      try {
        connector = await connectorFactory.build()
        const payload = { slug: 'my-awesome-channel' }
        await agent.post(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/channels`)
          .send(payload)

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(400)
        expect(message).to.be('Parameter type is missing')
        expect(results).to.be(null)
      }
    })

    it('should 400 with invalid type', async () => {
      try {
        connector = await connectorFactory.build()
        const payload = { slug: 'my-awesome-channel', type: 'yolo' }
        await agent.post(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/channels`)
          .send(payload)

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(400)
        expect(message).to.be('Parameter type is invalid')
        expect(results).to.be(null)
      }
    })

    it('should 400 with missing slug', async () => {
      try {
        connector = await connectorFactory.build()
        const payload = { type: 'messenger' }
        await agent.post(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/channels`)
          .send(payload)

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(400)
        expect(message).to.be('Parameter slug is missing')
        expect(results).to.be(null)
      }
    })

    it('should 404 without connector', async () => {
      try {
        const payload = { type: 'recastwebchat', slug: 'yoloswag' }
        await agent.post(`${process.env.ROUTETEST}/v1/connectors/d29dd4f8-aa8e-4224-81f9-c4da94db18b8/channels`)
          .send(payload)

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Connector not found')
        expect(results).to.be(null)
      }
    })
  })

  // Channel Update

  describe('Update', () => {
    afterEach(async () => {
      await Promise.all([
        Connector.remove(),
        Channel.remove(),
      ])
    })

    it('should 200 with valid parameters', async () => {
      connector = await connectorFactory.build()
      channel = await channelFactory.build(connector)
      const payload = { slug: 'my-awesome-channel-updated' }
      const res = await agent.put(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/channels/${channel.slug}`)
        .send(payload)
      const { results, message } = res.body

      expect(res.status).to.be(200)
      expect(message).to.be('Channel successfully updated')
      expect(results.slug).to.be(payload.slug)
      expect(results.id).to.be(channel._id)
      expect(results.type).to.be(channel.type)
    })

    it('should 404 without connector', async () => {
      try {
        const payload = { slug: 'updated-slug' }
        await agent.put(`${process.env.ROUTETEST}/v1/connectors/d29dd4f8-aa8e-4224-81f9-c4da94db18b8/channels/lol`)
          .send(payload)

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Connector not found')
        expect(results).to.be(null)
      }
    })

    it('should 404 without channel', async () => {
      try {
        connector = await connectorFactory.build()
        const payload = { slug: 'updated-slug' }
        await agent.put(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/channels/lol`)
          .send(payload)

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Channel not found')
        expect(results).to.be(null)
      }
    })
  })

  // Channel Delete

  describe('DELETE', () => {
    afterEach(async () => {
      await Promise.all([
        Connector.remove(),
        Channel.remove(),
      ])
    })

    it('should 200 with a channel', async () => {
      connector = await connectorFactory.build()
      channel = await channelFactory.build(connector)
      const res = await agent.del(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/channels/${channel.slug}`)
        .send()
      const { results, message } = res.body

      expect(res.status).to.be(200)
      expect(message).to.be('Channel successfully deleted')
      expect(results).to.be(null)
    })

    it('should 404 without connector', async () => {
      try {
        await agent.del(`${process.env.ROUTETEST}/v1/connectors/d29dd4f8-aa8e-4224-81f9-c4da94db18b8/channels/lol`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Connector not found')
        expect(results).to.be(null)
      }
    })

    it('should 404 without channel', async () => {
      try {
        connector = await connectorFactory.build()
        await agent.del(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/channels/lol`)
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

  // Channel Show

  describe('SHOW', () => {
    afterEach(async () => {
      await Promise.all([
        Connector.remove(),
        Channel.remove(),
      ])
    })

    it('should 200 with a channel', async () => {
      connector = await connectorFactory.build()
      channel = await channelFactory.build(connector)
      const res = await agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/channels/${channel.slug}`)
        .send()
      const { results, message } = res.body

      expect(res.status).to.be(200)
      expect(message).to.be('Channel successfully rendered')
      expect(results.type).to.be(channel.type)
      expect(results.id).to.be(channel.id)
      expect(results.slug).to.be(channel.slug)
    })

    it('should 404 without connector', async () => {
      try {
        await agent.get(`${process.env.ROUTETEST}/v1/connectors/d29dd4f8-aa8e-4224-81f9-c4da94db18b8/channels/lol`)
          .send()

        should.fail()
      } catch (err) {
        const { message, results } = err.response.body

        expect(err.status).to.be(404)
        expect(message).to.be('Connector not found')
        expect(results).to.be(null)
      }
    })

    it('should 404 without channel', async () => {
      try {
        connector = await connectorFactory.build()
        await agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/channels/lol`)
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

  // Channel Index

  describe('INDEX', () => {
    afterEach(async () => {
      Promise.all([
        Connector.remove(),
        Channel.remove(),
      ])
    })

    it('should 200 with channels', async () => {
      connector = await connectorFactory.build()
      channel = await channelFactory.build(connector)
      const res = await agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/channels`)
        .send()
      const { results, message } = res.body

      expect(res.status).to.be(200)
      expect(message).to.be('Channels successfully rendered')
      expect(results.length).to.equal(1)
      expect(results[0].id).to.equal(channel._id)
      expect(results[0].slug).to.equal(channel.slug)
      expect(results[0].type).to.equal(channel.type)
    })

    it('should 200 without channels', async () => {
      connector = await connectorFactory.build()
      const res = await agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/channels`)
        .send()
      const { results, message } = res.body

      expect(res.status).to.be(200)
      expect(message).to.be('No channels')
      expect(results.length).to.equal(0)
    })

    it('should 404 without connector', async () => {
      try {
        await agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/channels`)
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
