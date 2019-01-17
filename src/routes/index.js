import express from 'express'

import appRoutes from './application'
import connectorRoutes from './connectors'
import channelRoutes from './channels'
import messageRoutes from './messages'
import webhookRoutes from './webhooks'
import conversationRoutes from './conversations'
import participantRoutes from './participants'
import getStartedButtonRoutes from './get_started_buttons'
import persistentMenuRoutes from './persistent_menus'
import { getChannelIntegrationRoutes } from '../channel_integrations'
import { renderError } from '../utils/errors'

export const routes = [
  ...appRoutes,
  ...connectorRoutes,
  ...channelRoutes,
  ...messageRoutes,
  ...webhookRoutes,
  ...participantRoutes,
  ...conversationRoutes,
  ...getStartedButtonRoutes,
  ...persistentMenuRoutes,
  ...getChannelIntegrationRoutes(),
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

        // Validate the request authentication
        for (const authenticator of r.authenticators) {
          await authenticator(req, res)
        }

        await r.handler(req, res)
      } catch (err) {
        renderError(res, err)
      }

    })

  })

  app.get('/', (req, res) => {
    res.send('Hi!')
  })

  app.use('/v1', router)
}
