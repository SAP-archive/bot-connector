import expect from 'expect.js'
import should from 'should'
import superagent from 'superagent'
import superagentPromise from 'superagent-promise'
import '../util/start_application'
import connectorFacto from '../factories/Connector'
import persistentmenuFacto from '../factories/Persistent_menu'
import { Connector, Channel, PersistentMenu } from '../../src/models'

const agent = superagentPromise(superagent, Promise)

let connector = null

describe('Persistent menus controller', () => {

  describe('Create', () => {
    afterEach(async () => {
      await Promise.all([
        Connector.remove(),
        PersistentMenu.remove(),
      ])
    })

    it('should 200 with valid parameters', async () => {
      connector = await connectorFacto.build()

      const menu = {
        menu: {
          call_to_actions: [
            {
              type: 'web_url',
              payload: 'http://google.com',
              title: 'Lien vers Google en allemand',
            }],
        },
        language: 'de',
      }
      const res = await agent.post(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/persistentmenus`)
        .send(menu)
      const { results, message } = res.body

      expect(res.status).to.be(201)
      expect(message).to.be('PersistentMenu successfully created')
      expect(JSON.stringify(results.menu)).to.be(JSON.stringify(menu.menu))
      expect(results.language).to.be(menu.menu.language)
    })

    it('should 409 if menu already exists for a language', async () => {
      connector = await connectorFacto.build()

      const menu = {
        menu: {},
        language: 'de',
      }
      await persistentmenuFacto.build(connector, { locale: 'de' })
      try {
        await agent.post(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/persistentmenus`)
          .send(menu)

        should.fail()
      } catch (err) {
        const { message } = err.response.body
        expect(err.status).to.be(409)
        expect(message).to.be('A persistent menu already exists for this language')
      }
    })

    it('should 404 with no connector', async () => {
      try {
        await agent.post(`${process.env.ROUTETEST}/v1/connectors/d29dd4f8-aa8e-4224-81f9-c4da94db18b8/persistentmenus`)
      } catch (err) {
        const { message } = err.response.body
        expect(message).to.be('Connector not found')
        expect(err.status).to.be(404)
      }
    })
  })

  describe('Get', () => {
    afterEach(async () => {
      await Promise.all([
        Connector.remove(),
        Channel.remove(),
        PersistentMenu.remove(),
      ])
    })
    it('should 200 with one menu', async () => {
      connector = await connectorFacto.build()
      const data = {
        menu: {
          some: 'menu',
        },
        language: 'de',
      }
      await persistentmenuFacto.build(connector, { menu: data.menu, locale: data.language })
      const res = await agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/persistentmenus/de`)

      const { results, message } = res.body
      expect(message).to.be('PersistentMenu successfully rendered')
      expect(JSON.stringify(results.menu)).to.be(JSON.stringify(data.menu))
      expect(results.locale).to.be(data.language)
    })

    it('should 200 with multiple menus', async () => {
      connector = await connectorFacto.build()
      await persistentmenuFacto.build(connector, { locale: 'en' })
      await persistentmenuFacto.build(connector, { locale: 'fr' })
      await persistentmenuFacto.build(connector, { locale: 'de' })

      const res = await agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/persistentmenus`)

      const { results, message } = res.body
      expect(results.length).to.be(3)
      expect(message).to.be('Persistent menus successfully rendered')
    })

    it('should 404 with no menu for this language', async () => {
      connector = await connectorFacto.build()
      try {
        await agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/persistentmenus/de`)
      } catch (err) {
        const { message } = err.response.body
        expect(message).to.be('PersistentMenu not found')
        expect(err.status).to.be(404)
      }
    })

    it('should 404 with no connector', async () => {
      try {
        await agent.get(`${process.env.ROUTETEST}/v1/connectors/d29dd4f8-aa8e-4224-81f9-c4da94db18b8/persistentmenus/de`)
      } catch (err) {
        const { message } = err.response.body
        expect(message).to.be('Connector not found')
        expect(err.status).to.be(404)
      }
    })

  })

  describe('Update', () => {
    afterEach(async () => {
      await Promise.all([
        Connector.remove(),
        PersistentMenu.remove(),
      ])
    })

    it('should 200 with valid parameters', async () => {
      connector = await connectorFacto.build()
      await persistentmenuFacto.build(connector, { locale: 'en' })

      const data = {
        menu: {
          awesome: 'menu',
        },
      }
      const res = await agent.put(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/persistentmenus/en`)
        .send(data)

      const { results, message } = res.body
      expect(res.status).to.be(200)
      expect(message).to.be('PersistentMenu successfully updated')
      expect(JSON.stringify(results.menu)).to.be(JSON.stringify(data.menu))
    })

    it('should 404 with no connector', async () => {
      try {
        const data = { menu: {} }
        await agent.put(`${process.env.ROUTETEST}/v1/connectors/d29dd4f8-aa8e-4224-81f9-c4da94db18b8/persistentmenus/de`)
          .send(data)
      } catch (err) {
        const { message } = err.response.body
        expect(message).to.be('Connector not found')
        expect(err.status).to.be(404)
      }
    })
  })

  describe('DeleteAll', () => {
    afterEach(async () => {
      await Promise.all([
        Connector.remove(),
        PersistentMenu.remove(),
      ])
    })

    it('should 200', async () => {
      connector = await connectorFacto.build()

      await persistentmenuFacto.build(connector, { locale: 'de' })
      await persistentmenuFacto.build(connector, { locale: 'en' })

      const res = await agent.del(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/persistentmenus`)

      const { results, message } = res.body
      expect(res.status).to.be(200)
      expect(message).to.be('Persistent Menu successfully deleted')
      expect(results).to.be(null)
    })

    it('should 404 with no connector', async () => {
      try {
        const data = { menu: {} }
        await agent.del(`${process.env.ROUTETEST}/v1/connectors/d29dd4f8-aa8e-4224-81f9-c4da94db18b8/persistentmenus`)
          .send(data)
      } catch (err) {
        const { message } = err.response.body
        expect(message).to.be('Connector not found')
        expect(err.status).to.be(404)
      }
    })
  })

  describe('Delete', () => {
    afterEach(async () => {
      await Promise.all([
        Connector.remove(),
        PersistentMenu.remove(),
      ])
    })

    it('should 200', async () => {
      connector = await connectorFacto.build()

      await persistentmenuFacto.build(connector, { locale: 'de' })

      const res = await agent.del(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/persistentmenus/de`)

      const { results, message } = res.body
      expect(res.status).to.be(200)
      expect(message).to.be('Persistent Menu successfully deleted')
      expect(results).to.be(null)
    })

    it('should 404 with no connector', async () => {
      try {
        const data = { menu: {} }

        await persistentmenuFacto.build(connector, { locale: 'de' })

        await agent.del(`${process.env.ROUTETEST}/v1/connectors/d29dd4f8-aa8e-4224-81f9-c4da94db18b8/persistentmenus/de`)
          .send(data)
      } catch (err) {
        const { message } = err.response.body
        expect(message).to.be('Connector not found')
        expect(err.status).to.be(404)
      }
    })

    it('should 404 with non-existing menu', async () => {
      try {
        const data = { menu: {} }
        connector = await connectorFacto.build()

        await agent.del(`${process.env.ROUTETEST}/v1/connectors/${connector._id}/persistentmenus/de`)
          .send(data)
      } catch (err) {
        const { message } = err.response.body
        expect(message).to.be('PersistentMenu not found')
        expect(err.status).to.be(404)
      }
    })
  })
})
