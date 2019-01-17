import { logger } from './utils'
import { startApplication } from './app'
import config from '../config'

startApplication().then(
  () => logger.info(`App is running and listening to port ${config.server.port}`),
  (err) => logger.error(`Failed to start app: ${err}`))
