import express from 'express'
import contentType from 'content-type'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import rawBody from 'raw-body'
import { logger } from './utils'
import mongoose from 'mongoose'
import { createRouter } from './routes'
import config from '../config'

function createApplication () {
  const app = express()

  // Enable Cross Origin Resource Sharing
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', '*, Content-Type, Authorization')
    res.header('Access-Control-Allow-Methods', 'GET, DELETE, POST, PUT, OPTIONS')
    res.header('Access-Control-Max-Age', '86400')
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    res.header('Expires', '-1')
    res.header('Pragma', 'no-cache')
    next()
  })

  // stock a buffer containing the raw body in req.rawBody
  app.use(async (req, res, next) => {
    next() // eslint-disable-line callback-return

    if (req.method !== 'POST') { return }

    try {
      let encoding = 'utf-8'
      try {
        encoding = contentType.parse(req).parameters.charset
      } catch (e) {} // eslint-disable-line
      req.rawBody = await rawBody(req, {
        length: req.headers['content-length'],
        limit: '1mb',
        encoding,
      })
    } catch (err) {
      logger.error(`Error while getting raw body from request: ${err}`)
    }
  })

  // Enable auto parsing of json content
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  // Enable middleware logging
  app.use(morgan('dev'))
  return app
}

function connectMongoDB () {
  return new Promise((resolve, reject) => {
    logger.info('Connecting to MongoDB')
    // Use native Promise with mongoose
    mongoose.Promise = global.Promise

    let dbUrl = 'mongodb://'
    if (config.db.username) {
      dbUrl = `${dbUrl}${config.db.username}:${config.db.password}@`
    }
    const path = `${config.db.dbName}?ssl=${config.db.ssl || 'false'}`
    dbUrl = `${dbUrl}${config.db.host}:${config.db.port}/${path}`
    mongoose.connect(dbUrl)
    const db = mongoose.connection
    db.on('error', reject)
    db.once('open', () => {
      resolve(db)
    })
  })
}

function startExpressApp () {
  return new Promise((resolve) => {
    logger.info('Starting App')
    const app = createApplication()
    createRouter(app)
    app.listen(config.server.port, () => {
      app.emit('ready')
      resolve(app)
    })
  })
}

export async function startApplication () {
  await connectMongoDB()
  return startExpressApp()
}
