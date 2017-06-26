import _ from 'lodash'
import SparkClient from 'node-sparky'

import { Logger, arrayfy } from '../utils'
import { BadRequestError, StopPipeline } from '../utils/errors'
import Template from './Template.service'

/*
 * checkParamsValidity: ok
 * onChannelCreate: ok
 * onChannelUpdate: ok
 * onChannelDelete: ok
 * onWebhookChecking: default
 * checkSecurity: default
 * beforePipeline: default
 * extractOptions: ok
 * getRawMessage: default
 * sendIsTyping: default
 * updateConversationWithMessage: default
 * parseChannelMessage: ok
 * formatMessage: ok
 * sendMessage: ok
 */

export default class CiscoSpark extends Template {

  static checkParamsValidity (channel) {
    if (!channel.token) {
      throw new BadRequestError('Parameter token is missing')
    }
  }

  static async onChannelCreate (channel) {
    try {
      const spark = new SparkClient({ token: channel.token, webhookUrl: channel.webhook })
      const webhook = {
        name: channel.slug,
        targetUrl: channel.webhook,
        resource: 'messages',
        event: 'created',
      }

      const [me] = await Promise.all([
        spark.personMe(),
        spark.webhookAdd(webhook),
      ])

      channel.userName = me.id
      channel.isErrored = false
    } catch (err) {
      Logger.info('[Cisco] Error while setting the webhook')
      channel.isErrored = true
    }

    return channel.save()
  }

  static async onChannelUpdate (channel, oldChannel) {
    await CiscoSpark.onChannelDelete(oldChannel)
    await CiscoSpark.onChannelCreate(channel)
  }

  static async onChannelDelete (channel) {
    try {
      const spark = new SparkClient({ token: channel.token })
      const webhooks = await spark.webhooksGet()
      const webhook = webhooks.find(w => w.name === channel.slug)

      if (!webhook) { return }
      await spark.webhookRemove(webhook.id)
    } catch (err) {
      Logger.info('[Cisco] Error while unsetting the webhook')
    }
  }

  static extractOptions (req) {
    return {
      chatId: _.get(req, 'body.data.roomId'),
      senderId: _.get(req, 'body.data.personId'),
    }
  }

  static async parseChannelMessage (conversation, message, opts) {
    const spark = new SparkClient({ token: conversation.channel.token })

    message = await spark.messageGet(message.data.id) // decrypt the message
    if (message.personId === conversation.channel.userName) {
      throw new StopPipeline()
    }

    return [
      conversation,
      { attachment: { type: 'text', content: message.text } },
      { ...opts, mentioned: true },
    ]
  }

  static formatMessage (conversation, message) {
    const { type, content } = _.get(message, 'attachment', {})

    switch (type) {
    case 'text':
    case 'video':
      return { text: content }
    case 'picture':
      return { files: content }
    case 'list': {
      const payload = _.get(content, 'elements', [])
        .map(e => `**- ${e.title}**\n\n${e.subtitle}\n\n${e.imageUrl || ''}`)
      return {
        markdown: _.reduce(payload, (acc, str) => `${acc}\n\n${str}`, ''),
      }
    }
    case 'quickReplies':
      return {
        markdown: `**${_.get(content, 'title', '')}**\n\n`
          .concat(_.get(content, 'buttons', []).map(b => `- ${b.title}`).join('\n\n')),
      }
    case 'card':
      return {
        files: _.get(content, 'imageUrl', ''),
        markdown: `**${_.get(content, 'title', '')}**\n\n`
          .concat(`*${_.get(content, 'subtitle', '')}*\n\n`)
          .concat(_.get(content, 'buttons', []).map(b => `- ${b.title}`).join('\n\n')),
      }
    case 'carousel':
    case 'carouselle':
      return content.map(card => ({
        files: _.get(card, 'imageUrl', ''),
        markdown: `**${_.get(card, 'title', '')}**\n\n`
          .concat(`*${_.get(card, 'subtitle', '')}*\n\n`)
          .concat(_.get(card, 'buttons', []).map(b => `- ${b.title}`).join('\n\n')),
      }))
    default:
      throw new BadRequestError('Message type non-supported by CiscoSpark')
    }
  }

  static async sendMessage (conversation, messages, opts) {
    if (conversation.channel.userName !== opts.senderId) {
      const spark = new SparkClient({ token: conversation.channel.token })

      for (const message of arrayfy(messages)) {
        message.roomId = conversation.chatId
        await spark.messageSend(message)
      }
    }
  }

}
