import config from '../../config'
import kue from 'kue'
import { logger } from './index'

export class MessageQueue {
  constructor () {
    this.pollWatchers = {}
    // Redis queue to handle messages to send to long-polling sessions
    this.queue = kue.createQueue({ redis: config.redis })
  }

  subscribeToEvents () {
    const self = this
    this.queue.on('error', (err) => {
      logger.error(`Unexpected Redis/Kue error: ${err}`)
      process.exit(1)
    })
    // message received in a conversation
    this.queue.on('job enqueue', (id, conversationId) => {
      const watchers = self.pollWatchers[conversationId]
      if (!watchers || Object.keys(watchers).length <= 0) { return }
      kue.Job.get(id, (err, message) => {
        if (err) { return logger.error(`Error while getting message from Redis: ${err}`) }
        Object.values(watchers).forEach(watcher => watcher.handler(message.data))
      })
    })
  }

  removeWatcher (conversationId, watcherId) {
    if (this.pollWatchers[conversationId]) {
      delete this.pollWatchers[conversationId][watcherId]
      if (Object.keys(this.pollWatchers[conversationId]).length <= 0) {
        delete this.pollWatchers[conversationId]
      }
    }
  }

  setWatcher (conversationId, watcherId, watcher) {
    if (!this.pollWatchers[conversationId]) {
      this.pollWatchers[conversationId] = {}
    }
    this.pollWatchers[conversationId][watcherId] = { handler: watcher }
  }

  getQueue () {
    return this.queue
  }

}

const defaultQueue = new MessageQueue()
defaultQueue.subscribeToEvents()

export default defaultQueue
