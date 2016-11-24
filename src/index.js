import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'

import configs from '../config'
import { createRouter } from './routes/'
import { initServices } from './utils/init'

import Logger from './utils/Logger'

const app = express()

// Load the configuration
const env = process.env.NODE_ENV || 'development'
const config = configs[env]

// Load the models
global.Bot = require('./models/Bot.model')
global.Channel = require('./models/Channel.model')
global.Conversation = require('./models/Conversation.model')
global.Message = require('./models/Message.model')
global.Participant = require('./models/Participant.model')

// Enable Cross Origin Resource Sharing
app.use(cors())

// Enable auto parsing of json content
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Use native promise API with mongoose
mongoose.Promise = global.Promise

// Mongoose connection
/* eslint-disable no-console */
mongoose.connect(`mongodb://${config.db.host}:${config.db.port}/${config.db.dbName}`)
const db = mongoose.connection
db.on('error', err => {
  Logger.error('FAILED TO CONNECT', err)
  process.exit(1)
})

// Launch the application
db.once('open', () => {
  createRouter(app)
  initServices()
  app.listen(config.server.port)
  app.emit('ready')
  Logger.info(`App is running and listening to port ${config.server.port}`)
})
/* eslint-enable no-console */
