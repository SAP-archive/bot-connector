import _ from 'lodash'
import { URL } from 'url'
import { Message, HeroCard, CardAction, CardImage, ThumbnailCard, AttachmentLayout } from 'botbuilder'

import Template from './Template.service'
import { BadRequestError, StopPipeline } from '../utils/errors'
import { Logger, microsoftParseMessage, microsoftGetBot, microsoftMakeAttachement } from '../utils'

/*
 * checkParamsValidity: ok
 * onChannelCreate: default
 * onChannelUpdate: default
 * onChannelDelete: default
 * onWebhookChecking: default
 * checkSecurity: default
 * beforePipeline: default
 * extractOptions: ok
 * getRawMessage: ok
 * sendIsTyping: default
 * updateConversationWithMessage: ok
 * parseChannelMessage: ok
 * formatMessage: ok
 * sendMessage: ok
 */

const VIDEO_AS_LINK_HOSTS = [
  'youtube.com',
  'youtu.be',
]

export default class MicrosoftTemplate extends Template {

  static checkParamsValidity (channel) {
    const params = ['clientId', 'clientSecret']
    params.forEach(param => {
      if (!channel[param] || typeof channel[param] !== 'string') {
        throw new BadRequestError('Bad parameter '.concat(param).concat(' : missing or not string'))
      }
    })
  }

  static async extractOptions (req, res, channel) {
    const { session, message } = await microsoftParseMessage(channel, req)

    return {
      session,
      message,
      chatId: message.address.conversation.id,
      senderId: message.user.id,
    }
  }

  static sendIsTyping (channel, options) {
    options.session.sendTyping()
  }

  static getRawMessage (channel, req, options) {
    return options.message
  }

  static async updateConversationWithMessage (conversation, message, opts) {
    conversation.microsoftAddress = message.address
    conversation.markModified('microsoftAddress')

    return Promise.all([conversation.save(), message, opts])
  }

  static async parseChannelMessage (conversation, message, opts) {
    const msg = {}
    const attachment = _.get(message, 'attachments[0]')
    if (attachment) {
      if (attachment.contentType.startsWith('image')) {
        msg.attachment = { type: 'picture', content: attachment.contentUrl }
      } else if (attachment.contentType.startsWith('video')) {
        msg.attachment = { type: 'video', content: attachment.contentUrl }
      } else {
        Logger.info('No support for files of type : '.concat(attachment.contentType))
        Logger.info('Defaulting to text')
        if (!message.text || message.text.length <= 0) {
          Logger.error('No text')
          throw new StopPipeline()
        }
        msg.attachment = { type: 'text', content: message.text }
      }
    } else {
      msg.attachment = { type: 'text', content: message.text }
    }
    return Promise.all([conversation, msg, { ...opts, mentioned: true }])
  }

  static async formatMessage (conversation, message, opts) {
    const { type, content } = _.get(message, 'attachment')
    const msg = new Message()
    const mType = _.get(conversation, 'microsoftAddress.channelId', '')

    if (mType === 'teams') {
      opts.allVideosAsLink = true
      opts.allVideosAsLink = true
    }

    const makeCard = (constructor, e) => {
      return new constructor()
        .title(e.title)
        .subtitle(e.subtitle)
        .images([CardImage.create(undefined, e.imageUrl)])
        .buttons(e.buttons.map(button => {
          let fun = CardAction.imBack
          if (['web_url', 'account_linking'].indexOf(button.type) !== -1) {
            fun = CardAction.openUrl
          }
          return fun(undefined, button.value, button.title)
        }))
    }

    if (type === 'text') {
      msg.text(content)
    } else if (type === 'picture' || type === 'video') {
      let hostname = (new URL(content)).hostname
      if (hostname.startsWith('www.')) {
        hostname = hostname.slice(4, hostname.length)
      }
      if (type === 'video' && (VIDEO_AS_LINK_HOSTS.indexOf(hostname) !== -1 || opts.allVideosAsLink)) {
        msg.text(content)
      } else {
        const attachment = await microsoftMakeAttachement(content)
        msg.addAttachment(attachment)
      }
    } else if (type === 'quickReplies') {
      const attachment = new HeroCard()
        .title(content.title)
        .buttons(content.buttons.map(button => {
          return CardAction.imBack(undefined, button.value, button.title)
        }))
      msg.addAttachment(attachment)
    } else if (type === 'card') {
      const attachment = makeCard(HeroCard, content)
      msg.addAttachment(attachment)
    } else if (type === 'list') {
      const attachments = content.elements.map(e => {
        return makeCard(ThumbnailCard, e)
      })
      attachments.push(new ThumbnailCard()
        .buttons(content.buttons.map(button => {
          let fun = CardAction.imBack
          if (['web_url', 'account_linking'].indexOf(button.type) !== -1) {
            fun = CardAction.openUrl
          }
          return fun(undefined, button.value, button.title)
        }))
      )
      msg.attachments(attachments)
    } else if (type === 'carousel' || type === 'carouselle') {
      const attachments = content.map(e => {
        return makeCard(HeroCard, e)
      })
      msg.attachments(attachments)
      msg.attachmentLayout(AttachmentLayout.carousel)
    } else {
      throw new BadRequestError('Message type non-supported by Microsoft : '.concat(type))
    }
    return msg
  }

  static async sendMessage (conversation, message) {
    const channel = conversation.channel
    const bot = microsoftGetBot(channel)
    const address = conversation.microsoftAddress
    bot.send(message.address(address))
  }

}
