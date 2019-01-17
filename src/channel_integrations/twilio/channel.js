import _ from 'lodash'
import crypto from 'crypto'
import superagent from 'superagent'
import superagentPromise from 'superagent-promise'

import AbstractChannelIntegration from '../abstract_channel_integration'
import { BadRequestError, ForbiddenError, textFormatMessage } from '../../utils'

const agent = superagentPromise(superagent, Promise)

export default class Twilio extends AbstractChannelIntegration {

  validateChannelObject (channel) {
    channel.phoneNumber = channel.phoneNumber.split(' ').join('')

    if (!channel.clientId) {
      throw new BadRequestError('Parameter is missing: Client Id')
    } else if (!channel.clientSecret) {
      throw new BadRequestError('Parameter is missing: Client Secret')
    } else if (!channel.serviceId) {
      throw new BadRequestError('Parameter is missing: Service Id')
    } else if (!channel.phoneNumber) {
      throw new BadRequestError('Parameter is missing: Phone Number')
    }
  }

  authenticateWebhookRequest (req, res, channel) {
    const signature = req.headers['x-twilio-signature']
    const webhook = channel.webhook
    let str = webhook
    _.forOwn(_.sortBy(Object.keys(req.body)), (value) => {
      str += value
      str += req.body[value]
    })
    const hmac = crypto.createHmac('SHA1', channel.clientSecret).update(str).digest('base64')
    if (signature !== hmac) {
      throw new ForbiddenError()
    }
  }

  populateMessageContext (req) {
    const { body } = req

    return {
      chatId: `${body.To}${body.From}`,
      senderId: body.From,
    }
  }

  parseIncomingMessage (conversation, message) {
    return {
      attachment: {
        type: 'text',
        content: message.Body,
      },
    }
  }

  formatOutgoingMessage (conversation, message, opts) {
    const { chatId } = conversation
    const to = opts.senderId

    let msg
    try {
      msg = textFormatMessage(message)
    } catch (error) {
      throw new BadRequestError('Message type non-supported by Twilio')
    }

    return { chatId, to, ...msg }
  }

  async sendMessage (conversation, message) {
    const data = {
      To: message.to,
      Body: message.body,
      From: conversation.channel.phoneNumber,
      MessagingServiceSid: conversation.channel.serviceId,
    }
    const url
      = `https://api.twilio.com/2010-04-01/Accounts/${conversation.channel.clientId}/Messages.json`
    await agent('POST', url)
      .auth(conversation.channel.clientId, conversation.channel.clientSecret)
      .type('form')
      .send(data)
  }

}
