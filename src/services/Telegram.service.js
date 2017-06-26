import _ from 'lodash'
import superAgent from 'superagent'
import superAgentPromise from 'superagent-promise'

import { Logger } from '../utils'
import Template from './Template.service'
import { ValidationError, BadRequestError } from '../utils/errors'

const agent = superAgentPromise(superAgent, Promise)

/*
 * checkParamsValidity: ok
 * onChannelCreate: ok
 * onChannelUpdate: ok
 * onChannelDelete: ok
 * onWebhookChecking: default
 * checkSecurity: default
 * beforePipeline: ok
 * extractOptions: ok
 * getRawMessage: default
 * sendIsTyping: default
 * updateConversationWithMessage: default
 * parseChannelMessage: ok
 * formatMessage: ok
 * sendMessage: ok
 * formatParticipantData: default
 * getParticipantInfos: default
 */

export default class Telegram extends Template {

  static checkParamsValidity (channel) {
    if (!channel.token) {
      throw new ValidationError('token', 'missing')
    }
  }

  static async onChannelCreate (channel) {
    const { token, webhook } = channel

    try {
      await Telegram.setWebhook(token, webhook)
      channel.isErrored = false
    } catch (err) {
      Logger.info('[Telegram] Cannot set webhook')
      channel.isErrored = true
    }

    return channel.save()
  }

  static async onChannelUpdate (channel, oldChannel) {
    await Telegram.onChannelDelete(oldChannel)
    await Telegram.onChannelCreate(channel)
  }

  static async onChannelDelete (channel) {
    const { token } = channel

    try {
      const { status } = await agent.get(`https://api.telegram.org/bot${token}/deleteWebhook`)

      if (status !== 200) {
        throw new BadRequestError(`[Telegram][Status ${status}] Cannot delete webhook`)
      }
    } catch (err) {
      Logger.info('[Telegram] Cannot unset the webhook')
      channel.isErrored = true
    }
  }

  static checkSecurity (req, res) {
    res.status(200).send({ status: 'success' })
  }

  static extractOptions (req) {
    return {
      chatId: _.get(req, 'body.message.chat.id'),
      senderId: _.get(req, 'body.message.chat.id'),
    }
  }

  static parseChannelMessage (conversation, { message }, options) {
    const type = Object.keys(message).slice(-1)[0] // Get the key name of last message element
    const channelType = _.get(conversation, 'channel.type')
    const content = _.get(message, `${type}`, '')

    return ([
      conversation,
      {
        attachment: { type, content },
        channelType,
      }, {
        ...options,
        mentioned: true,
      },
    ])
  }

  static formatMessage ({ channel, chatId }, { attachment }, { senderId }) {
    const { type, content } = attachment
    const reply = {
      chatId,
      type,
      to: senderId,
      token: _.get(channel, 'token'),
    }

    switch (type) {
    case 'text':
    case 'video':
      return { ...reply, body: content }
    case 'picture':
      return { ...reply, type: 'photo', body: content }
    case 'card':
    case 'quickReplies':
      return {
        ...reply,
        type: 'card',
        photo: _.get(content, 'imageUrl'),
        body: `*${_.get(content, 'title', '')}*\n**${_.get(content, 'subtitle', '')}**`,
        keyboard: [_.get(content, 'buttons', []).map(b => ({ text: b.title }))],
      }
    case 'list':
      return {
        ...reply,
        keyboard: [_.get(content, 'buttons', []).map(b => ({ text: b.title }))],
        body: content.elements.map(e => `*- ${e.title}*\n${e.subtitle}\n${e.imageUrl || ''}`),
      }
    case 'carousel':
    case 'carouselle':
      return {
        ...reply,
        body: content.map(({ imageUrl, buttons, title, subtitle }) => ({
          header: `*${title}*\n[${subtitle || ''}](${imageUrl})`,
          text: ['```'].concat(buttons.map(({ title, value }) => `${value} - ${title}`)).concat('```').join('\n'),
        })),
      }
    default:
      throw new BadRequestError('Message type non-supported by Telegram')
    }
  }

  static async sendMessage ({ channel }, { token, type, to, body, photo, keyboard }) {
    const url = `https://api.telegram.org/bot${token}`
    const method = type === 'text' ? 'sendMessage' : `send${_.capitalize(type)}`

    if (type === 'card') {
      if (!_.isUndefined(photo)) {
        await agent.post(`${url}/sendPhoto`, { chat_id: to, photo })
      }
      await agent.post(`${url}/sendMessage`, { chat_id: to, text: body, reply_markup: { keyboard, one_time_keyboard: true }, parse_mode: 'Markdown' })
    } else if (type === 'quickReplies') {
      await agent.post(`${url}/sendMessage`, { chat_id: to, text: body, reply_markup: { keyboard, one_time_keyboard: true } })
    } else if (type === 'carousel' || type === 'carouselle') {
      body.forEach(async ({ header, text }) => {
        await agent.post(`${url}/sendMessage`, { chat_id: to, text: header, parse_mode: 'Markdown' })
        await agent.post(`${url}/sendMessage`, { chat_id: to, text, parse_mode: 'Markdown' })
      })
    } else if (type === 'list') {
      for (const elem of body) {
        await agent.post(`${url}/sendMessage`, { chat_id: to, text: elem, parse_mode: 'Markdown' })
      }
    } else {
      await agent.post(`${url}/${method}`, { chat_id: to, [type]: body })
    }
  }

  /*
   * Telegram specific helpers
   */

  // Set a Telegram webhook
  static async setWebhook (token, webhook) {
    const url = `https://api.telegram.org/bot${token}/setWebhook`
    const { status } = await agent.post(url, { url: webhook })

    if (status !== 200) {
      throw new BadRequestError(`[Telegram][Status ${status}] Cannot set webhook`)
    }
  }

}
