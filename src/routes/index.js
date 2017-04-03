import express from 'express'
import { Logger } from '../utils'

import appRoutes from './App.routes'
import oauthRoutes from './Oauth.routes'
import connectorRoutes from './Connectors.routes'
import channelRoutes from './Channels.routes'
import messagesRoutes from './Messages.routes'
import webhooksRoutes from './Webhooks.routes'
import conversationRoutes from './Conversations.routes'
import participantsRoutes from './Participants.routes'

import { renderConnectorError } from '../utils/errors'

export const routes = [
  ...appRoutes,
  ...oauthRoutes,
  ...connectorRoutes,
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
        renderConnectorError(res, err)
      }
    })
  })

  app.use(router)

}
