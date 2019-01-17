import expect from 'expect.js'
import should from 'should'
import superagent from 'superagent'
import superagentPromise from 'superagent-promise'
import '../util/start_application'
import { Connector } from '../../src/models'
import config from '../../config'
import connectorFactory from '../factories/Connector'

let connector = null

const agent = superagentPromise(superagent, Promise)

describe('Connector Controller', () => {
  beforeEach(async () => {
    connector = await connectorFactory.build()
  })

  afterEach(async () => {
    await Connector.remove()
  })

  it('should Create with valid parameters', async () => {
    await Connector.remove()
    const payload = { url: 'https://mynewconnector.com' }
    const res = await agent.post(`${process.env.ROUTETEST}/v1/connectors`)
      .send(payload)
    const { results, message } = res.body

    expect(res.status).to.be(201)
    expect(message).to.be('Connector successfully created')
    expect(results.url).to.be('https://mynewconnector.com')
  })

  it('should not Create with missing url', async () => {
    try {
      await Connector.remove()
      const payload = { }
      await agent.post(`${process.env.ROUTETEST}/v1/connectors`)
        .send(payload)

      should.fail()
    } catch (err) {
      const { message, results } = err.response.body

      expect(err.status).to.be(400)
      expect(message).to.be('Parameter url is missing')
      expect(results).to.be(null)
    }
  })

  it('should not Create with invalid url', async () => {
    try {
      await Connector.remove()
      const payload = { url: 'lol' }
      await agent.post(`${process.env.ROUTETEST}/v1/connectors`)
        .send(payload)

      should.fail()
    } catch (err) {
      const { message, results } = err.response.body

      expect(err.status).to.be(400)
      expect(message).to.be('Parameter url is invalid')
      expect(results).to.be(null)
    }
  })

  it('should Update with valid parameters', async () => {
    const payload = { url: 'https://myupdatedconnector.com' }
    const res = await agent.put(`${process.env.ROUTETEST}/v1/connectors/${connector._id}`)
      .send(payload)
    const { results, message } = res.body

    expect(res.status).to.be(200)
    expect(message).to.be('Connector successfully updated')
    expect(results.url).to.be(payload.url)
  })

  it('should not Update with invalid url', async () => {
    try {
      const payload = { url: 'Invalidurl' }
      await agent.put(`${process.env.ROUTETEST}/v1/connectors/${connector._id}`)
        .send(payload)

      should.fail()
    } catch (err) {
      const { message, results } = err.response.body

      expect(err.status).to.be(400)
      expect(message).to.be('Parameter url is invalid')
      expect(results).to.be(null)
    }
  })

  it('should Show a valid bot', async () => {
    const res = await agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector._id}`)
    const { results, message } = res.body

    expect(res.status).to.be(200)
    expect(message).to.be('Connector successfully found')
    expect(results.id).to.be(connector._id)
    expect(results.url).to.be(connector.url)
    expect(results.isTyping).to.be(connector.isTyping)
  })

  it('should not Show an invalid bot', async () => {
    try {
      await Connector.remove()
      await agent.get(`${process.env.ROUTETEST}/v1/connectors/d29dd4f8-aa8e-4224-81f9-c4da94db18b8`)

      should.fail()
    } catch (err) {
      const { message, results } = err.response.body

      expect(err.status).to.be(404)
      expect(message).to.be('Connector not found')
      expect(results).to.be(null)
    }
  })

  it('should Delete a valid connector', async () => {
    const res = await agent.del(`${process.env.ROUTETEST}/v1/connectors/${connector._id}`)
    const { results, message } = res.body

    expect(res.status).to.be(200)
    expect(message).to.be('Connector successfully deleted')
    expect(results).to.be(null)
  })

  it('should not delete an invalid bot', async () => {
    try {
      await Connector.remove()
      await agent.del(`${process.env.ROUTETEST}/v1/connectors/d29dd4f8-aa8e-4224-81f9-c4da94db18b8`)

      should.fail()
    } catch (err) {
      const { message, results } = err.response.body

      expect(err.status).to.be(404)
      expect(message).to.be('Connector not found')
      expect(results).to.be(null)
    }
  })

})
