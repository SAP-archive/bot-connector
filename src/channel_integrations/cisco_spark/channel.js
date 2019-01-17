import _ from 'lodash'
import SparkClient from 'node-sparky'

import { logger, arrayfy } from '../../utils'
import { BadRequestError, StopPipeline } from '../../utils/errors'
import AbstractChannelIntegration from '../abstract_channel_integration'

export default class CiscoSpark extends AbstractChannelIntegration {

  validateChannelObject (channel) {
    if (!channel.token) {
      throw new BadRequestError('Parameter token is missing')
    }
  }

  async beforeChannelCreated (channel) {
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
      logger.error(`[Cisco] Error while setting the webhook: ${err}`)
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
      const spark = new SparkClient({ token: channel.token })
      const webhooks = await spark.webhooksGet()
      const webhook = webhooks.find(w => w.name === channel.slug)

      if (!webhook) { return }
      await spark.webhookRemove(webhook.id)
    } catch (err) {
      logger.error(`[Cisco] Error while unsetting the webhook: ${err}`)
    }
  }

  populateMessageContext (req) {
    return {
      chatId: _.get(req, 'body.data.roomId'),
      senderId: _.get(req, 'body.data.personId'),
    }
  }

  async parseIncomingMessage (conversation, message) {
    const spark = new SparkClient({ token: conversation.channel.token })

    message = await spark.messageGet(message.data.id) // decrypt the message
    if (message.personId === conversation.channel.userName) {
      throw new StopPipeline()
    }

    return { attachment: { type: 'text', content: message.text } }
  }

  formatOutgoingMessage (conversation, message) {
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
    case 'buttons':
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
    case 'custom':
      return content
    default:
      throw new BadRequestError('Message type non-supported by CiscoSpark')
    }
  }

  async sendMessage (conversation, messages, opts) {
    if (conversation.channel.userName !== opts.senderId) {
      const spark = new SparkClient({ token: conversation.channel.token })

      for (const message of arrayfy(messages)) {
        message.roomId = conversation.chatId
        await spark.messageSend(message)
      }
    }
  }

}
