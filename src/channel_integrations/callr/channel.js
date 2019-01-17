import _ from 'lodash'
import callr from 'callr'
import crypto from 'crypto'

import { logger, BadRequestError, ForbiddenError, textFormatMessage } from '../../utils'
import AbstractChannelIntegration from '../abstract_channel_integration'

export default class Callr extends AbstractChannelIntegration {

  validateChannelObject (channel) {
    if (!channel.password) {
      throw new BadRequestError('Parameter password is missing')
    } else if (!channel.userName) {
      throw new BadRequestError('Parameter userName is missing')
    }
  }

  async beforeChannelCreated (channel) {
    const type = 'sms.mo'
    const context = { hmac_secret: channel.password, hmac_algo: 'SHA256' }
    const api = new callr.api(channel.userName, channel.password)

    try {
      await new Promise((resolve, reject) =>
        (api.call('webhooks.subscribe', type, channel.webhook, context)
          .success(async (res) => {
            channel.webhookToken = res.hash
            resolve()
          })
          .error(reject)))
      channel.isErrored = false
    } catch (err) {
      logger.error('[CallR] Error while setting webhook', err)
      channel.isErrored = true
    }

    return channel.save()
  }

  async afterChannelUpdated (channel, oldChannel) {
    await this.afterChannelDeleted(oldChannel)
    await this.beforeChannelCreated(channel)
  }

  async afterChannelDeleted (channel) {
    try {
      const api = new callr.api(channel.userName, channel.password)
      await new Promise((resolve, reject) => (api.call('webhooks.unsubscribe', channel.webhookToken)
        .success(resolve)
        .error(reject)))
    } catch (err) {
      logger.error(`[CallR] Error while unsetting webhook: ${err}`)
    }
  }

  authenticateWebhookRequest (req, res, channel) {
    const { password } = channel
    const payload = JSON.stringify(req.body)
    const webhookSig = req.headers['x-callr-hmacsignature']
    const hash = crypto.createHmac('SHA256', password).update(payload).digest('base64')

    if (hash !== webhookSig) {
      throw new ForbiddenError()
    }
  }

  populateMessageContext (req) {
    return {
      chatId: _.get(req, 'body.data.from'),
      senderId: _.get(req, 'body.data.to'),
    }
  }

  parseIncomingMessage (conversation, message) {
    return {
      attachment: {
        type: 'text',
        content: message.data.text,
      },
      channelType: 'callr',
    }
  }

  formatOutgoingMessage (conversation, message) {
    let body
    try {
      ({ body } = textFormatMessage(message))
    } catch (error) {
      throw new BadRequestError('Message type is non-supported by Callr')
    }

    return body
  }

  sendMessage (conversation, message, opts) {
    return new Promise(async (resolve, reject) => {
      const { senderId } = opts
      const { chatId, channel } = conversation
      const api = new callr.api(channel.userName, channel.password)

      api.call('sms.send', senderId, chatId, message, null)
        .success(resolve)
        .error(reject)
    })
  }

}
