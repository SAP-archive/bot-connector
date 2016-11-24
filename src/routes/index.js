import express from 'express'

import appRoutes from './App.routes.js'
import botRoutes from './Bots.routes.js'
import channelRoutes from './Channels.routes.js'
import messagesRoutes from './Messages.routes.js'
import webhooksRoutes from './Webhooks.routes.js'
import conversationRoutes from './Conversations.routes.js'
import participantsRoutes from './Participants.routes.js'

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
    if (r.validators) {
      router[r.method.toLowerCase()](r.path, ...r.validators, r.handler)
    } else {
      router[r.method.toLowerCase()](r.path, r.handler)
    }
  })
  app.use(router)
}
