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
    let channel = await models.Channel.findById(channel_id).populate('children').populate('connector')

    if (!channel) {
      throw new NotFoundError('Channel')
    } else if (!channel.isActivated) {
      throw new BadRequestError('Channel is not activated')
    } else if (!channel.type) {
      throw new BadRequestError('Type is not defined')
    }

    await invoke(channel.type, 'checkSecurity', [req, res, channel])

    channel = await invoke(channel.type, 'beforePipeline', [req, res, channel])
    const options = invokeSync(channel.type, 'extractOptions', [req, res, channel])

    if (channel.connector.isTyping) {
      invoke(channel.type, 'sendIsTyping', [channel, options, req.body])
    }

    const message = await invoke(channel.type, 'getRawMessage', [channel, req, options])

    await controllers.Messages.pipeMessage(channel._id, message, options)
  }

  static async subscribeWebhook (req, res) {
    const { channel_id } = req.params
    const channel = await global.models.Channel.findById(channel_id)

    if (!channel) {
      throw new NotFoundError('Channel')
    }

    return invoke(channel.type, 'onWebhookChecking', [req, res, channel])
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

}
