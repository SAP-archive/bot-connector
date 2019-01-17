import chai from 'chai'
import * as integrations_module from '../../src/channel_integrations'
const { getChannelIntegrationByIdentifier, getChannelIntegrationRoutes,
  MODULES } = integrations_module
import Callr from '../../src/channel_integrations/callr/channel'

const should = chai.should()
const expect = chai.expect

/* eslint no-unused-expressions: 0 */  // --> OFF

function validateRouteObject (route) {
  expect(['GET', 'POST', 'PUT']).to.include(route.method)
  expect(route.path).to.be.an('array').that.is.not.empty
  expect(route.validators).to.be.an('array')
  expect(route.authenticators).to.be.an('array')
  expect(route.handler).to.be.a('function')
}

const sourcePath = '../../src/channel_integrations'
// flatten
const IDENTIFIERS = [].concat.apply([], MODULES.map(moduleName => require(`${sourcePath}/${moduleName}`).identifiers))

MODULES.forEach(moduleName => describe(`${moduleName} channel integration module`, () => {

  let module
  beforeEach(() => {
    module = require(`${sourcePath}/${moduleName}`)
  })

  it('should have unique identifiers', () => {
    module.identifiers.forEach(identifier => {
      const count = IDENTIFIERS.filter(i => i === identifier).length
      expect(count).to.equal(1)
    })
  })

  it('should export all mandatory fields', () => {
    should.exist(module)
    should.exist(module.channel)
    should.exist(module.identifiers)
    expect(module.identifiers).to.be.an('array')
    module.identifiers.forEach(i => expect(i).to.be.a('string'))
  })

  it('should export optional fields with the correct type', () => {
    if (module.routes) { expect(module.routes).to.be.an('array') }
  })

  it('should define valid routes', () => {
    if (!module.routes) { return }
    module.routes.forEach(validateRouteObject)
  })

  it('should define all mandatory service methods')

}))

describe('getChannelIntegrationByIdentifier', () => {

  it('should return undefined for unknown identifiers', () => {
    expect(getChannelIntegrationByIdentifier('unknown')).to.be.undefined
  })

  describe('with correct identifier', () => {

    let integration

    beforeEach(() => {
      integration = getChannelIntegrationByIdentifier('callr')
    })

    it('should return a channel integration instance', () => {
      expect(integration).to.be.an.instanceof(Callr)
    })

    it('should return an instance which overrides abstract methods', () => {
      const body = { body: { data: { from: 'me', to: 'you' } } }
      expect(integration.populateMessageContext(body)).to.eql({ chatId: 'me', senderId: 'you' })
    })
  })
})

describe('getChannelIntegrationRoutes', () => {

  it('should return a non-empty array', () => {
    expect(getChannelIntegrationRoutes()).to.be.an('array').that.is.not.empty
  })

  it('should only contain proper route objects', () => {
    getChannelIntegrationRoutes().forEach(validateRouteObject)
  })
})
