import _ from 'lodash'
import crypto from 'crypto'

import ServiceTemplate from './Template.service'
import {
  BadRequestError,
  ForbiddenError,
} from '../utils/errors'

const agent = require('superagent-promise')(require('superagent'), Promise)

export default class TwilioService extends ServiceTemplate {

  /* Check parameter validity to create a Channel */
  static checkParamsValidity (channel) {
    const { clientId, clientSecret, serviceId } = channel
    channel.phoneNumber = channel.phoneNumber.split(' ').join('')

    if (!clientId) { throw new BadRequestError('Parameter is missing: Client Id') }
    if (!clientSecret) { throw new BadRequestError('Parameter is missing: Client Secret') }
    if (!serviceId) { throw new BadRequestError('Parameter is missing: Service Id') }
    if (!channel.phoneNumber) { throw new BadRequestError('Parameter is missing: Phone Number') }

    return true
  }

  static checkSecurity (req, res, channel) {
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

  /* Call when a message is received, before the pipeline */
  static beforePipeline (req, res, channel) {
    res.status(200).send()
    return channel
  }

  /* Call before entering the pipeline, to build the options object */
  static extractOptions (req) {
    const { body } = req

    return {
      chatId: `${body.To}${body.From}`,
      senderId: body.From,
    }
  }

  /* Call to parse a message received from a channel */
  static parseChannelMessage (conversation, message, opts) {
    const msg = {
      attachment: {
        type: 'text',
        content: message.Body,
      },
      channelType: 'twilio',
    }
    return [conversation, msg, opts]
  }

  /* Call to format a message received by the bot */
  static formatMessage (conversation, message, opts) {
    const { chatId } = conversation
    const { type, content } = message.attachment
    const to = opts.senderId

    const text = () => { return content }

    const quickReplies = () => {
      if (!content.title || !content.buttons) { throw new BadRequestError('Missing buttons or title for quickReplies type') }
      return [`${content.title}:`]
        .concat(content.buttons.map(({ title }) => {
          if (!title) { throw new BadRequestError('Missing title for quickReplies type') }
          return title
        })).join('\r\n')
    }

    const card = () => {
      if (!content.title || !content.buttons) { throw new BadRequestError('Missing buttons arguments or title for card type') }
      return [`${content.title}:`]
        .concat(content.buttons.map(({ title, value }) => {
          if (!title || !value) { throw new BadRequestError('Missing title for card type') }
          return `${value} - ${title}`
        })).join('\r\n')
    }

    const carouselle = () => {
      const ret = []
      _.forEach(content, (card) => {
        if (!card.title || !card.buttons) { throw new BadRequestError('Missing buttons arguments or title for carouselle type') }
        if (card.subtitle) { card.title += `\r\n${card.subtitle}` }
        ret.push([`${card.title}:`]
          .concat(card.buttons.map(({ title, value }) => {
            if (!title || !value) { throw new BadRequestError('Missing title for carouselle type') }
            return `${value} - ${title}`
          })).join('\r\n'))
      })
      return ret.join('\r\n')
    }

    const fns = { card, text, quickReplies, carouselle }
    if (fns[type]) { return [{ chatId, to, body: fns[type](), type }] }

    throw new BadRequestError(`Message type ${type} unsupported by Twilio`)
  }

  /* Call to send a message to a bot */
  static async sendMessage (conversation, messages) {
    const data = {
      From: conversation.channel.phoneNumber,
      MessagingServiceSid: conversation.channel.serviceId,
      To: '',
      Body: '',
    }
    for (const message of messages) {
      data.Body = message.body
      data.To = message.to
      await agent('POST', `https://api.twilio.com/2010-04-01/Accounts/${conversation.channel.clientId}/Messages.json`)
        .auth(conversation.channel.clientId, conversation.channel.clientSecret)
        .type('form')
        .send(data)
    }
  }

}
