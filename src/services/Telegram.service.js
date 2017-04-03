import _ from 'lodash'
import superAgent from 'superagent'
import superAgentPromise from 'superagent-promise'

import ServiceTemplate from './Template.service'
import { ValidationError, BadRequestError } from '../utils/errors'

const agent = superAgentPromise(superAgent, Promise)

export default class TelegramService extends ServiceTemplate {

  static async setWebhook (token, webhook) {
    const url = `https://api.telegram.org/bot${token}/setWebhook`
    const { status } = await agent.post(url, { url: webhook })

    if (status !== 200) {
      throw new BadRequestError(`[Telegram][Status ${status}] Cannot set Webhook`)
    }
  }

  /* Telegram token is required */
  static checkParamsValidity (req) {
    if (!req.token) {
      throw new ValidationError('token', 'missing')
    }
  }

  /* Call when a channel is created, set webhook */
  static async onChannelCreate ({ token, webhook, ...channel }) {
    try {
      await TelegramService.setWebhook(token, webhook)
    } catch (err) {
      channel.isErrored = true
    }
  }

  /* Call when a channel is updated, update webhook */
  static onChannelUpdate = TelegramService.onChannelCreate

  /* Call when a channel is deleted */
  static async onChannelDelete ({ token, ...channel }) {
    try {
      const { status } = await agent.get(`https://api.telegram.org/bot${token}/deleteWebhook`)

      if (status !== 200) {
        throw new BadRequestError(`[Telegram][Status ${status}] Cannot delete Webhook`)
      }
    } catch (err) {
      channel.isErrored = true
    }
  }

  /* Call when a message is received, before the pipeline */
  static beforePipeline (req, res, channel) {
    res.status(200).send({ status: 'success' })
    return channel
  }

  // /* Call before entering the pipeline, to build the options object */
  static extractOptions ({ body }) {
    return {
      chatId: _.get(body, 'message.chat.id'),
      senderId: _.get(body, 'message.chat.id'),
    }
  }

  /* Call to parse a message received from a channel */
  static parseChannelMessage (conversation, { message }, options) {
    const type = Object.keys(message).slice(-1)[0] // Get the key name of last message element
    const channelType = _.get(conversation, 'channel.type')
    const content = _.get(message, `${type}`, '')

    return ([
      conversation, {
        attachment: { type, content },
        channelType,
      }, options,
    ])
  }

  /* Call to format a message received by the bot */
  static formatMessage ({ channel, chatId }, { attachment }, { senderId }) {
    const { type, content } = attachment
    const buttons = _.get(content, 'buttons', [])
    const reply = {
      chatId,
      type,
      to: senderId,
      token: _.get(channel, 'token'),
    }

    switch (type) {
    case 'picture':
      return { ...reply, type: 'photo', body: content }
    case 'quickReplies':
    case 'card':
      return {
        ...reply,
        type: 'card',
        photo: _.get(content, 'imageUrl'),
        body: [`*${_.get(content, 'title', '')}*`]
          .concat('```')
          .concat(buttons.map(({ title, value }) => `${value} - ${title}`))
          .concat('```')
          .join('\n'),
      }
    case 'carouselle':
      return {
        ...reply,
        body: content.map(({ imageUrl, buttons, title, subtitle }) => ({
          header: [`*${title}*`].concat(`[${subtitle}](${imageUrl})`).join('\n'),
          text: ['```'].concat(buttons.map(({ title, value }) => `${value} - ${title}`)).concat('```').join('\n'),
        })),
      }
    default:
      return { ...reply, body: content }
    }
  }

  /* Call to send a message to a bot */
  static async sendMessage ({ channel }, { token, type, to, body, photo }) {
    const url = `https://api.telegram.org/bot${token}`
    const method = type === 'text' ? 'sendMessage' : `send${_.capitalize(type)}`

    try {
      if (type === 'card') {
        if (!_.isUndefined(photo)) {
          await agent.post(`${url}/sendPhoto`, { chat_id: to, photo })
        }
        await agent.post(`${url}/sendMessage`, { chat_id: to, text: body, parse_mode: 'Markdown' })
      } else if (type === 'carouselle') {
        body.forEach(async ({ header, text }) => {
          await agent.post(`${url}/sendMessage`, { chat_id: to, text: header, parse_mode: 'Markdown' })
          await agent.post(`${url}/sendMessage`, { chat_id: to, text, parse_mode: 'Markdown' })
        })
      } else {
        await agent.post(`${url}/${method}`, { chat_id: to, [type]: body })
      }
    } catch (err) {
      channel.isErrored = true
    }
  }

}
