import _ from 'lodash'

import AbstractChannelIntegration from '../abstract_channel_integration'
import { logger, getTwitterWebhookToken,
  deleteTwitterWebhook, postMediaToTwitterFromUrl } from '../../utils'
import { BadRequestError, ForbiddenError, StopPipeline } from '../../utils/errors'
import Twit from 'twit'
import { URL } from 'url'

const VIDEO_AS_LINK_HOSTS = [
  'youtube.com',
  'youtu.be',
]

export default class Twitter extends AbstractChannelIntegration {

  validateChannelObject (channel) {
    const params = ['consumerKey', 'consumerSecret', 'accessToken', 'accessTokenSecret', 'envName']
    params.forEach(param => {
      if (!channel[param] || typeof channel[param] !== 'string') {
        throw new BadRequestError('Bad parameter '.concat(param).concat(' : missing or not string'))
      }
    })
  }

  async afterChannelCreated (channel) {
    const T = new Twit({
      consumer_key: channel.consumerKey,
      consumer_secret: channel.consumerSecret,
      access_token: channel.accessToken,
      access_token_secret: channel.accessTokenSecret,
      app_only_auth: true,
      timeout_ms: 60 * 1000,
    })

    try {
      // Get the previously set webhook
      const res = await T.get(`account_activity/all/${channel.envName}/webhooks`, {})

      if (!res.data || res.data.length === 0) {
        throw new Error()
      }
      // Try to delete the webhook if there's one
      await deleteTwitterWebhook(T, res.data[0].id, channel.envName)
    } catch (err) {
      logger.error(`[Twitter] Unable to get and delete previously set webhook: ${err}`)
    }

    try {
      T.config.app_only_auth = false
      const res = await T.post(`account_activity/all/${channel.envName}/webhooks`,
        { url: channel.webhook })
      const ret = res.data

      channel.isErrored = ret.valid !== true || !ret.url || !ret.id
      if (channel.isErrored) {
        throw new Error()
      }

      await T
        .post(`account_activity/all/${channel.envName}/subscriptions`, {})
      const account = await T.get('account/verify_credentials', {})
      channel.clientId = account.data.id_str
    } catch (err) {
      logger.error(`[Twitter] Unable to set the webhook: ${err}`)
      channel.isErrored = true
    }

    return channel.save()
  }

  async afterChannelUpdated (channel, oldChannel) {
    await this.afterChannelDeleted(oldChannel)
    await this.beforeChannelCreated(channel)
  }

  async afterChannelDeleted (channel) {
    const T = new Twit({
      consumer_key: channel.consumerKey,
      consumer_secret: channel.consumerSecret,
      access_token: channel.accessToken,
      access_token_secret: channel.accessTokenSecret,
      timeout_ms: 60 * 1000,
    })

    try {
      await deleteTwitterWebhook(T, channel.webhookToken)
    } catch (err) {
      logger.error(`[Twitter] Error while unsetting webhook: ${err}`)
    }
  }

  validateWebhookSubscriptionRequest (req, res, channel) {
    if (!channel.consumerSecret) {
      throw new BadRequestError('Error while checking webhook validity : no channel.consumerSecret')
    }

    const crcToken = req.query.crc_token
    const sha = getTwitterWebhookToken(channel.consumerSecret, crcToken)
    res.status(200).json({ response_token: sha })
  }

  authenticateWebhookRequest (req, res, channel) {
    const hash = req.headers['X-Twitter-Webhooks-Signature']
      || req.headers['x-twitter-webhooks-signature'] || ''
    const test = getTwitterWebhookToken(channel.consumerSecret, req.rawBody)

    if (!hash.startsWith('sha256=') || hash !== test) {
      throw new ForbiddenError('Invalid Twitter signature')
    }
  }

  populateMessageContext (req) {
    const recipientId
      = _.get(req, 'body.direct_message_events[0].message_create.target.recipient_id')
    const senderId
      = _.get(req, 'body.direct_message_events[0].message_create.sender_id')

    return {
      chatId: `${recipientId}-${senderId}`,
      senderId,
    }
  }

  parseIncomingMessage (conversation, message, opts) {
    message = _.get(message, 'direct_message_events[0]')
    const channel = conversation.channel
    const senderId = _.get(message, 'message_create.sender_id')
    const recipientId = _.get(message, 'message_create.target.recipient_id')
    const data = _.get(message, 'message_create.message_data')
    const quickReply = _.get(message, 'message_create.message_data.quick_reply_response.metadata')

    // can be an echo message
    if (senderId !== opts.senderId
      || senderId === channel.clientId
      || recipientId !== channel.clientId
      || !data) {
      throw new StopPipeline()
    }

    const msg = {}
    const hasMedia = (_.get(data, 'attachment.type') === 'media')
    if (quickReply) {
      msg.attachment = { type: 'text', content: quickReply, is_button_click: true }
    } else if (!hasMedia) {
      msg.attachment = { type: 'text', content: _.get(data, 'text') }
    } else {
      const media = _.get(data, 'attachment.media')
      let type = media.type
      if (type === 'photo' || type === 'animated_gif') {
        type = 'picture'
      } else if (type === 'video') {
        type = 'video'
      } else {
        throw new StopPipeline()
      }
      msg.attachment = { type, content: media.media_url }
    }
    return msg
  }

  async formatOutgoingMessage (conversation, message, opts) {
    const { type, content } = _.get(message, 'attachment')
    let data = [{ text: '' }]

    const makeListElement = async ({ title, imageUrl, subtitle, buttons }) => {
      const msg = {}
      const mediaId = await postMediaToTwitterFromUrl(conversation.channel, imageUrl)
      msg.attachment = { type: 'media', media: { id: mediaId } }
      msg.text = `${title}\r\n`
      if (subtitle) {
        msg.text += subtitle.concat('\r\n')
      }
      buttons = buttons.map(({ title }) => `- ${title}`).join('\r\n')
      msg.text += buttons
      return msg
    }

    if (type === 'text') {
      data[0].text = content
    } else if (type === 'video' || type === 'picture') {
      let hostname = (new URL(content)).hostname
      if (hostname.startsWith('www.')) {
        hostname = hostname.slice(4, hostname.length)
      }
      if (type === 'video' && VIDEO_AS_LINK_HOSTS.indexOf(hostname) !== -1) {
        data[0].text = content
      } else {
        const mediaId = await postMediaToTwitterFromUrl(conversation.channel, content)
        data[0].attachment = { type: 'media', media: { id: mediaId } }
      }
    } else if (type === 'quickReplies') {
      data[0].text = content.title
      const context = content.buttons
        .map(({ title, value }) => ({ label: title, metadata: value }))
      data[0].quick_reply = { type: 'options', options: context }
    } else if (type === 'card') {
      const { title, subtitle, imageUrl, buttons } = content
      const mediaId = await postMediaToTwitterFromUrl(conversation.channel, imageUrl)
      data[0].attachment = { type: 'media', media: { id: mediaId } }
      data[0].text = title

      data.push({})
      data[1] = { text: subtitle.length > 0 ? subtitle : '.' }
      const context = buttons
        .map(({ title, value }) => ({ label: title, metadata: value }))
      data[1].quick_reply = { type: 'options', options: context }
    } else if (type === 'carousel' || type === 'carouselle') {
      data = await Promise.all(content
        .map(makeListElement))
    } else if (type === 'list') {
      data = await Promise.all(content.elements
        .map(makeListElement))
      if (content.buttons) {
        const context = content.buttons
          .map(({ title, value }) => ({ label: title, metadata: value }))
        data.push({ text: '_', quick_reply: { type: 'options', options: context } })
      }
    } else if (type === 'buttons') {
      data[0].text = content.title
      data[0].ctas = content.buttons
        .map(({ title, value }) => ({ type: 'web_url', label: title, url: value }))
    } else if (type === 'custom') {
      data = content
    } else {
      throw new BadRequestError('Message type non-supported by Twitter : '.concat(type))
    }

    const makeMessage = (data) => {
      return {
        event: {
          type: 'message_create',
          message_create: {
            target: { recipient_id: opts.senderId },
            message_data: data,
          },
        },
      }
    }

    return data.map(makeMessage)
  }

  async sendMessage (conversation, message) {
    const channel = conversation.channel
    const T = new Twit({
      consumer_key: channel.consumerKey,
      consumer_secret: channel.consumerSecret,
      access_token: channel.accessToken,
      access_token_secret: channel.accessTokenSecret,
      timeout_ms: 60 * 1000,
    })

    await T.post('direct_messages/events/new', message)
  }

  /*
   * Gromit methods
   */

  populateParticipantData (participant, channel) {
    return new Promise((resolve, reject) => {
      const T = new Twit({
        consumer_key: channel.consumerKey,
        consumer_secret: channel.consumerSecret,
        app_only_auth: true,
        timeout_ms: 60 * 1000,
      })

      T.get('users/lookup', { user_id: participant.senderId }, (err, data) => {
        if (err) {
          logger.error(`[Twitter] Error when retrieving Twitter user info: ${err}`)
          return reject(err)
        }
        if (data.length <= 0) {
          const msg = '[Twitter] Error when retrieving Twitter user info: no data'
          logger.error(msg)
          return reject(new Error(msg))
        }
        participant.data = data[0]
        participant.markModified('data')
        participant.save().then(resolve).catch(reject)
      })
    })
  }

  parseParticipantDisplayName (participant) {
    const informations = {}

    // could get quite a lot more information
    if (participant.data) {
      informations.userName = participant.data.name
    }

    return informations
  }
}
