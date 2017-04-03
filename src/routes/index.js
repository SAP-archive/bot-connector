import express from 'express'
import { Logger } from '../utils'

import appRoutes from './App.routes.js'
import connectorRoutes from './Connectors.routes.js'
import channelRoutes from './Channels.routes.js'
import messagesRoutes from './Messages.routes.js'
import webhooksRoutes from './Webhooks.routes.js'
import conversationRoutes from './Conversations.routes.js'
import participantsRoutes from './Participants.routes.js'

import { renderConnectorError } from '../utils/errors'

export const routes = [
  ...appRoutes,
  ...botRoutes,
  ...channelRoutes,
  ...messagesRoutes,
  ...webhooksRoutes,
  ...conversationRoutes,
  ...participantsRoutes,
]

export const createRouter = app => {
  const router = express.Router()

  routes.forEach(r => {
    router[r.method.toLowerCase()](r.path, async (req, res) => {
      try {
        // Validate the request parameters
        for (const validator of r.validators) {
          await validator(req, res)
        }

        await r.handler(req, res)
      } catch (err) {
        Logger.error(err)
        renderConnectorError(err)
      }
    })
  })

}
