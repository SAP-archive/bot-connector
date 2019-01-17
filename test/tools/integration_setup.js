import { Channel, Connector } from '../../src/models'
import config from '../../config/test'
import nock from 'nock'
import superagentPromise from 'superagent-promise'
import superagent from 'superagent'
import _ from 'lodash'

const agent = superagentPromise(superagent, Promise)
const connectorUrl = config.skillsBuilderUrl
async function newConnector (opts = {}) {
  const connector = new Connector({
    url: opts.url || connectorUrl,
    isActive: opts.isActive || true,
  })
  return connector.save()
}

export function setupChannelIntegrationTests (cleanupDB = true) {

  process.env.ROUTETEST = `http://localhost:${config.server.port}`

  afterEach(async () => {
    if (cleanupDB) {
      await Connector.remove()
      await Channel.remove()
    }
  })

  async function sendMessageToWebhook (
    channel, message, additionalHeaders = {}, connectorResponse
  ) {
    nock(connectorUrl)
      .post('')
      .reply(200, connectorResponse || {
        messages: JSON.stringify([{ type: 'text', content: 'my message' }]),
      })
    const baseHeaders = {
      Accept: '*/*',
    }
    const headers = _.extend(baseHeaders, additionalHeaders)
    try {
      return await agent.post(channel.webhook).set(headers).send(message)
    } catch (e) {
      nock.cleanAll()
      throw e
    }

  }

  return {
    sendMessageToWebhook,
    createChannel: async (parameters) => {
      const connector = await newConnector()
      return agent.post(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/channels`)
        .send(parameters)
    },
    deleteChannel: async (channel, headers = {}) => {
      return agent.del(`${process.env.ROUTETEST}/v1/connectors/${channel.connector}/channels/${channel.slug}`)
        .set(headers)
        .send()
    },
    updateChannel: async (channel, payload, headers = {}) => {
      return agent.put(`${process.env.ROUTETEST}/v1/connectors/${channel.connector}/channels/${channel.slug}`)
        .set(headers)
        .send(payload)
    },
  }
}
