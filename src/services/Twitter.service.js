import _ from 'lodash'

import Template from './Template.service'
import { Logger, getTwitterWebhookToken, deleteTwitterWebhook, postMediaToTwitterFromUrl } from '../utils'
import { BadRequestError, ForbiddenError, StopPipeline } from '../utils/errors'
import Twit from 'twit'
import { URL } from 'url'

/*
 * checkParamsValidity: ok
 * onChannelCreate: ok
 * onChannelUpdate: ok
 * onChannelDelete: ok
 * onWebhookChecking: ok
 * checkSecurity: ok
 * beforePipeline: default
 * extractOptions: ok
 * getRawMessage: default
 * sendIsTyping: default
 * updateConversationWithMessage: default
 * parseChannelMessage: ok
 * formatMessage: ok
 * sendMessage: ok
 */

const VIDEO_AS_LINK_HOSTS = [
  'youtube.com',
  'youtu.be',
]

export default class Twitter extends Template {

  static checkParamsValidity (channel) {
    const params = ['consumerKey', 'consumerSecret', 'accessToken', 'accessTokenSecret']
    params.forEach(param => {
      if (!channel[param] || typeof channel[param] !== 'string') {
        throw new BadRequestError('Bad parameter '.concat(param).concat(' : missing or not string'))
      }
    })
  }

  static async onChannelCreate (channel) {
    const T = new Twit({
      consumer_key: channel.consumerKey,
      consumer_secret: channel.consumerSecret,
      access_token: channel.accessToken,
      access_token_secret: channel.accessTokenSecret,
      timeout_ms: 60 * 1000,
    })

    try {
      // Get the previously set webhook
      const res = await T.get('account_activity/webhooks', {})

      if (!res.data || res.data.length === 0) {
        throw new Error()
      }

      // Try to delete the webhook if there's one
      await new Promise((resolve, reject) => {
        T._buildReqOpts('DELETE', `account_activity/webhooks/${res.data[0].id}`, {}, false, (err, reqOpts) => {
          if (err) { return reject(err) }

          T._doRestApiRequest(reqOpts, {}, 'DELETE', (err, parsedBody) => {
            if (err) { return reject(err) }
            return resolve(parsedBody)
          })
        })
      })
    } catch (err) {
      Logger.info('[Twitter] unable to get and delete previously set webhook')
    }

    try {
      const res = await T.post('account_activity/webhooks', { url: channel.webhook })
      const ret = res.data

      channel.isErrored = ret.valid !== true || ret.url !== channel.webhook || !ret.id
      if (!channel.isErrored) {
        channel.webhookToken = ret.id
        await T.post('account_activity/webhooks/'.concat(channel.webhookToken).concat('/subscriptions'), {})
        const account = await T.get('account/verify_credentials', {})
        channel.clientId = account.data.id_str
      }
    } catch (err) {
      Logger.inspect('[Twitter] unable to set the webhook')
      channel.isErrored = true
    }

    return channel.save()
  }

  static async onChannelUpdate (channel, oldChannel) {
    await Twitter.onChannelDelete(oldChannel)
    await Twitter.onChannelCreate(channel)
  }

  static async onChannelDelete (channel) {
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
      Logger.info('[Twitter] Error while unsetting webhook : ', err)
    }
  }

  static onWebhookChecking (req, res, channel) {
    if (!channel.consumerSecret) {
      throw new BadRequestError('Error while checking webhook validity : no channel.consumerSecret')
    }

    const crcToken = req.query.crc_token
    const sha = getTwitterWebhookToken(channel.consumerSecret, crcToken)
    res.status(200).json({ response_token: sha })
  }

  static checkSecurity (req, res, channel) {
    const hash = req.headers['X-Twitter-Webhooks-Signature'] || req.headers['x-twitter-webhooks-signature'] || ''
    const test = getTwitterWebhookToken(channel.consumerSecret, req.rawBody)

    if (hash.startsWith('sha256=') && hash === test) {
      res.status(200).send()
    } else {
      throw new ForbiddenError('Invalid Twitter signature')
    }
  }

  static extractOptions (req) {
    const recipientId = _.get(req, 'body.direct_message_events[0].message_create.target.recipient_id')
    const senderId = _.get(req, 'body.direct_message_events[0].message_create.sender_id')

    return {
      chatId: `${recipientId}-${senderId}`,
      senderId,
    }
  }

  static async parseChannelMessage (conversation, message, opts) {
    message = _.get(message, 'direct_message_events[0]')
    const channel = conversation.channel
    const senderId = _.get(message, 'message_create.sender_id')
    const recipientId = _.get(message, 'message_create.target.recipient_id')

    // can be an echo message
    if (senderId !== opts.senderId || senderId === channel.clientId || recipientId !== channel.clientId) {
      throw new StopPipeline()
    }
    const data = _.get(message, 'message_create.message_data')
    if (!data) {
      throw new StopPipeline()
    }
    const msg = {}
    const hasMedia = (_.get(data, 'attachment.type') === 'media')
    if (!hasMedia) {
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
    return Promise.all([conversation, msg, { ...opts, mentioned: true }])
  }

  static async formatMessage (conversation, message, opts) {
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
      const options = content.buttons
        .map(({ title, value }) => ({ label: title, metadata: value }))
      data[0].quick_reply = { type: 'options', options }
    } else if (type === 'card') {
      const { title, subtitle, imageUrl, buttons } = content
      const mediaId = await postMediaToTwitterFromUrl(conversation.channel, imageUrl)
      data[0].attachment = { type: 'media', media: { id: mediaId } }
      data[0].text = title

      data.push({})
      data[1] = { text: subtitle.length > 0 ? subtitle : '.' }
      const options = buttons
        .map(({ title, value }) => ({ label: title, metadata: value }))
      data[1].quick_reply = { type: 'options', options }
    } else if (type === 'carousel' || type === 'carouselle') {
      data = await Promise.all(content
        .map(makeListElement))
    } else if (type === 'list') {
      data = await Promise.all(content.elements
        .map(makeListElement))
      if (content.buttons) {
        const options = content.buttons
          .map(({ title, value }) => ({ label: title, metadata: value }))
        data.push({ text: '_', quick_reply: { type: 'options', options } })
      }
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

  static async sendMessage (conversation, message) {
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

}
