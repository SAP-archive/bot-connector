import request from 'superagent'

import MessagesController from '../controllers/Messages.controller.js'
import MessengerService from '../services/Messenger.service.js'

import {
  invoke,
  invokeSync,
} from '../utils'
import Logger from '../utils/Logger'
import { notFoundError, handleMongooseError } from '../utils/errors'

export default class WebhooksController {

  /**
   * Call the Message pipeline
   */
  static async forwardMessage (req, res) {

    const { channel_id } = req.params
    const channel = await Channel.findById(channel_id)
    if (!channel) { throw new notFoundError('Channel') }

    const opts = invokeSync(channel.type, 'extractOptions', [req, channel])
    if (!invokeSync(channel.type, 'checkSecurity', [req, channel])) { return res.status(400) }
    await invoke(channel.type, 'beforePipeline', [res, channel])

    return MessagesController.pipeMessage(channel_id, req.body, opts)
    .then((res) => {
      Logger.info(res)
    })
    .catch((err) => {
      Logger.error(err)
    })
  }

  /**
   * Send a message to a bot
   */
  static sendMessageToBot ([conversation, message, opts]) {
    return new Promise((resolve, reject) => {
      request.post(conversation.bot.url)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({ message, chatId: opts.chatId, senderId: opts.senderId })
        .end((err, response) => {
          if (err) { return reject(err) }
          return resolve([conversation, response.body, opts])
        })
    })
  }

  /**
   * Send a message to a channel
   */
  static async sendMessage ([conversation, messages, opts]) {
    const channelType = conversation.channel.type

    for (const message of messages) {
      await invoke(channelType, 'sendMessage', [conversation, message, opts])
    }

    return conversation
  }

  static subscribeFacebookWebhook (req, res) {
    Channel.findById(req.params.channel_id)
      .then(channel => {
        if (!channel) { return Promise.reject(new notFoundError('Channel')) }

        if (MessengerService.connectWebhook(req, channel)) {
          res.status(200).send(req.query['hub.challenge'])
        } else {
          Logger.warning('Error while connecting the webhook')
          res.status(403).json({ results: null, message: 'Error while connecting the webhook' })
        }
      })
      .catch(err => handleMongooseError(err, res, 'Error while connecting to Messenger'))
  }
}
