import nock from 'nock'
import { startApplication } from '../../src/app'

const config = require('../../config/test')
process.env.ROUTETEST = `http://localhost:${config.server.port}`

before(async () => {
  // nock all external request
  nock.disableNetConnect()
  nock.enableNetConnect(/(localhost)/)

  await startApplication()
})
