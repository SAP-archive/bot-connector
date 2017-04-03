import request from 'superagent'

import { invoke, invokeSync } from '../utils'
import { NotFoundError, BadRequestError } from '../utils/errors'

export default class WebhooksController {
  /**
   * Receive a new message from a channel
   * Retrieve the proper channel
   * Invoke beforePipeline, extractOptions and checkSecurity
   * Call the pipeline
   */
  static async forwardMessage (req, res) {
    const { channel_id } = req.params
    let channel = await models.Channel.findById(channel_id).populate({ path: 'children' })

    if (!channel) {
      throw new NotFoundError('Channel')
    } else if (!channel.isActivated) {
      throw new BadRequestError('Channel is not activated')
    } else if (!channel.type) {
      throw new BadRequestError('Type is not defined')
    }

    channel = await invoke(channel.type, 'beforePipeline', [req, res, channel])

    const options = invokeSync(channel.type, 'extractOptions', [req, res, channel])
    invokeSync(channel.type, 'checkSecurity', [req, res, channel])

    await controllers.Messages.pipeMessage(channel._id, req.body, options)
  }

  /**
   * Send a message to a bot
   */
  static sendMessageToBot ([conversation, message, opts]) {
    return new Promise((resolve, reject) => {
      request.post(conversation.connector.url)
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

  // TODO Abstract it!
  static async subscribeFacebookWebhook (req, res) {
    const { channel_id } = req.params

    const channel = await models.Channel.findById(channel_id)
    if (!channel) { throw new NotFoundError('Channel') }

    if (services.messenger.connectWebhook(req, channel)) {
      res.status(200).send(req.query['hub.challenge'])
    } else {
      res.status(403).json({ results: null, message: 'Error while connecting the webhook' })
    }
  }

}
