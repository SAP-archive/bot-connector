import express from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import _ from 'lodash'

import configs from '../config'
import { initServices, Logger } from './utils'

const app = express()

// Load the mongoose Schemas

import _models from './models'
import _controllers from './controllers'
import _services from './services'

global.models = _models
global.controllers = _controllers
global.services = {}

_.forOwn(_services, (service, serviceName) => {
  services[serviceName.toLowerCase()] = service
})

const createRouter = require('./routes').createRouter

// Load the configuration
global.config = configs

// Enable Cross Origin Resource Sharing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*, X-Expiry, X-Client, X-Access-Token, X-Uuid, Content-Type, Authorization')
  res.header('Access-Control-Expose-Headers', 'X-Client, X-Access-Token, X-Expiry, X-Uuid')
  res.header('Access-Control-Allow-Methods', 'GET, DELETE, POST, PUT, OPTIONS')
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  res.header('Expires', '-1')
  res.header('Pragma', 'no-cache')
  next()
})

// Enable auto parsing of json content
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Use native promise API with mongoose
mongoose.Promise = global.Promise

// Mongoose connection
let dbUrl = 'mongodb://'

if (config.db.username) {
  dbUrl = `${dbUrl}${config.db.username}:${config.db.password}@`
}
dbUrl = `${dbUrl}${config.db.host}:${config.db.port}/${config.db.dbName}?ssl=${config.db.ssl || 'false'}`

mongoose.connect(dbUrl)
const db = mongoose.connection
db.on('error', err => {
  Logger.error('FAILED TO CONNECT', err)
  process.exit(1)
})

// Launch the application
db.once('open', () => {
  createRouter(app)
  initServices()
  app.listen(config.server.port, () => {
    app.emit('ready')
    Logger.info(`App is running and listening to port ${config.server.port}`)
  })
})
