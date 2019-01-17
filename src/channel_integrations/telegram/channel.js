import _ from 'lodash'
import superAgent from 'superagent'
import superAgentPromise from 'superagent-promise'

import AbstractChannelIntegration from '../abstract_channel_integration'
import { logger } from '../../utils'
import {
  BadRequestError,
  InternalServerError,
  StopPipeline,
  ValidationError,
} from '../../utils/errors'

const agent = superAgentPromise(superAgent, Promise)

export default class Telegram extends AbstractChannelIntegration {

  validateChannelObject (channel) {
    if (!channel.token) {
      throw new ValidationError('token', 'missing')
    }
  }

  async beforeChannelCreated (channel) {
    const { token, webhook } = channel

    try {
      await this.setWebhook(token, webhook)
      channel.isErrored = false
    } catch (err) {
      logger.error(`[Telegram] Cannot set webhook: ${err}`)
      channel.isErrored = true
    }

    return channel.save()
  }

  async afterChannelUpdated (channel, oldChannel) {
    await this.afterChannelDeleted(oldChannel)
    await this.beforeChannelCreated(channel)
  }

  async afterChannelDeleted (channel) {
    const { token } = channel

    try {
      const { status } = await agent.get(`https://api.telegram.org/bot${token}/deleteWebhook`)

      if (status !== 200) {
        throw new InternalServerError(`[Telegram][Status ${status}] Cannot delete webhook`)
      }
    } catch (err) {
      logger.error(`[Telegram] Cannot unset the webhook: ${err}`)
      channel.isErrored = true
    }
  }

  populateMessageContext (req) {
    if (req.body.edited_message || req.body.edited_channel_post) {
      throw new StopPipeline()
    }

    const message = req.body.message || req.body.channel_post
    return {
      chatId: _.get(message, 'chat.id'),
      senderId: _.get(message, 'from.id'),
    }
  }

  finalizeWebhookRequest (req, res) {
    res.status(200).send({ status: 'success' })
  }

  parseIncomingMessage (conversation, { message, callback_query }) {
    const channelType = _.get(conversation, 'channel.type')
    const content = _.get(message, 'text')

    const buttonClickText = _.get(callback_query, 'data')

    if (!content && !buttonClickText) {
      logger.error('[Telegram] No text field in incoming message')
      throw new StopPipeline()
    }

    return {
      attachment: { type: 'text', content: content || buttonClickText },
      channelType,
    }
  }

  formatOutgoingMessage ({ channel, chatId }, { attachment }, { senderId }) {
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
        keyboard: tgKeyboardLayout(content.buttons.map(tgFormatButton)),
      }
    case 'list':
      return {
        ...reply,
        keyboard: tgKeyboardLayout(
          _.flattenDeep([
            content.buttons.map(tgFormatButton),
            content.elements.map(elem => elem.buttons.map(tgFormatButton)),
          ])
        ),
        body: content.elements.map(e => `*- ${e.title}*\n${e.subtitle}\n${e.imageUrl || ''}`),
      }
    case 'carousel':
    case 'carouselle':
      return {
        ...reply,
        keyboard: tgKeyboardLayout(
          _.flatten(
            content.map(card => card.buttons.map(tgFormatButton))
          )
        ),
        body: content.map(({ imageUrl, title, subtitle }) =>
          `*${title}*\n[${subtitle || ''}](${imageUrl})`),
      }
    case 'buttons':
      return {
        ...reply,
        type: 'text',
        keyboard: tgKeyboardLayout(content.buttons.map(tgFormatButton)),
        body: _.get(content, 'title', ''),
      }
    case 'custom':
      return {
        ...reply,
        body: content,
      }
    default:
      throw new BadRequestError('Message type non-supported by Telegram')
    }
  }

  async sendMessage ({ channel }, { token, type, chatId, body, photo, keyboard }) {
    const url = `https://api.telegram.org/bot${token}`
    const method = type === 'text' ? 'sendMessage' : `send${_.capitalize(type)}`

    if (type === 'card') {
      try {
        if (!_.isUndefined(photo)) {
          await agent.post(`${url}/sendPhoto`, { chat_id: chatId, photo })
        }
        await agent.post(`${url}/sendMessage`, {
          chat_id: chatId,
          text: body,
          reply_markup: { keyboard, one_time_keyboard: true },
          parse_mode: 'Markdown',
        })
      } catch (err) {
        this.logSendMessageError(err, type)
      }
    } else if (type === 'quickReplies') {
      try {
        await agent.post(`${url}/sendMessage`, {
          chat_id: chatId,
          text: body,
          reply_markup: { keyboard, one_time_keyboard: true },
        })
      } catch (err) {
        this.logSendMessageError(err, type)
      }
    } else if (type === 'carousel' || type === 'carouselle' || type === 'list') {
      let i = 0
      for (const elem of body) {
        // Send keyboard if this is the last POST request
        if (i === body.length - 1) {
          try {
            await agent.post(`${url}/sendMessage`, {
              chat_id: chatId,
              text: elem,
              reply_markup: { keyboard, one_time_keyboard: true },
              parse_mode: 'Markdown',
            })
          } catch (err) {
            this.logSendMessageError(err, type)
          }
        }
        try {
          await agent.post(
            `${url}/sendMessage`, { chat_id: chatId, text: elem, parse_mode: 'Markdown' }
          )
        } catch (err) {
          this.logSendMessageError(err, type)
        }
        i++
      }
    } else if (type === 'custom') {
      const allowedMethods = [
        'sendPhoto',
        'sendAudio',
        'sendDocument',
        'sendVideo',
        'sendVoice',
        'sendVideoNote',
        'sendMediaGroup',
        'sendLocation',
        'sendVenue',
        'sendContact',
        'sendChatAction',
      ]

      for (const elem of body) {
        const { method: customMethod, content } = elem

        if (!allowedMethods.includes(customMethod)) {
          throw new BadRequestError(`Custom method ${customMethod} non-supported by Telegram`)
        }

        try {
          await agent.post(`${url}/${customMethod}`, { ...content, chat_id: chatId })
        } catch (err) {
          this.logSendMessageError(err, type, customMethod)
        }
      }
    } else {
      try {
        await agent.post(`${url}/${method}`, {
          chat_id: chatId,
          [type]: body,
          reply_markup: { keyboard, one_time_keyboard: true },
        })
      } catch (err) {
        this.logSendMessageError(err, type, method)
      }
    }
  }

  /*
   * Telegram specific helpers
   */

  logSendMessageError (err, type, method) {
    if (method) {
      logger.error(`[Telegram] Error sending message of type ${type} using method ${method}: ${err}`)
    } else if (!method && type) {
      logger.error(`[Telegram] Error sending message of type ${type}: ${err}`)
    } else {
      logger.error(`[Telegram] Error sending message: ${err})`)
    }
    logger.error(
      `[Telegram] Error response: ${err.response.text}`,
      '[Telegram] Error details', err.response.error
    )
  }

  // Set a Telegram webhook
  async setWebhook (token, webhook) {
    const url = `https://api.telegram.org/bot${token}/setWebhook`
    const { status } = await agent.post(url, { url: webhook })

    if (status !== 200) {
      throw new BadRequestError(`[Telegram][Status ${status}] Cannot set webhook`)
    }
  }

}

// These functions are exported only for tests purpose
export function tgFormatButton (button) {
  const payload = { text: button.title }
  if (button.type === 'web_url') {
    payload.url = button.value
  } else {
    payload.callback_data = button.value
  }
  return payload
}

const TG_MAX_KEYBOARD_LINES = 3

export function tgKeyboardLayout (buttons) {
  const elemPerLine = Math.floor(buttons.length / TG_MAX_KEYBOARD_LINES)
  const extraButtons = buttons.length % TG_MAX_KEYBOARD_LINES
  const lines = []
  let seen = 0
  while (seen < buttons.length) {
    const nb = elemPerLine + (extraButtons > lines.length ? 1 : 0)
    lines.push(buttons.slice(seen, seen + nb))
    seen += nb
  }

  return lines
}
