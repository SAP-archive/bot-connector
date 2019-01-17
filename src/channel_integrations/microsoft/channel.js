import _ from 'lodash'
import url from 'url'
import {
  Message, HeroCard, CardAction,
  CardImage, ThumbnailCard, AttachmentLayout } from 'botbuilder'

import AbstractChannelIntegration from '../abstract_channel_integration'
import { logger } from '../../utils'
import { BadRequestError, StopPipeline } from '../../utils/errors'
import { microsoftParseMessage, microsoftGetBot, microsoftMakeAttachement } from './utils'

const VIDEO_AS_LINK_HOSTS = [
  'youtube.com',
  'youtu.be',
]

export default class MicrosoftTemplate extends AbstractChannelIntegration {

  validateChannelObject (channel) {
    const params = ['clientId', 'clientSecret']
    params.forEach(param => {
      if (!channel[param] || typeof channel[param] !== 'string') {
        throw new BadRequestError('Bad parameter '.concat(param).concat(' : missing or not string'))
      }
    })
  }

  validateWebhookSubscriptionRequest (req, res) {
    res.status(200).send()
  }

  async populateMessageContext (req, res, channel) {
    const { session, message } = await microsoftParseMessage(channel, req)

    return {
      session,
      message,
      chatId: message.address.conversation.id,
      senderId: message.user.id,
    }
  }

  onIsTyping (channel, context) {
    context.session.sendTyping()
  }

  getRawMessage (channel, req, context) {
    return context.message
  }

  updateConversationContextFromMessage (conversation, message) {
    conversation.microsoftAddress = message.address
    conversation.markModified('microsoftAddress')
    return conversation
  }

  parseIncomingMessage (conversation, message) {
    const msg = {}
    const attachment = _.get(message, 'attachments[0]')
    if (attachment) {
      if (attachment.contentType.startsWith('image')) {
        msg.attachment = { type: 'picture', content: attachment.contentUrl }
      } else if (attachment.contentType.startsWith('video')) {
        msg.attachment = { type: 'video', content: attachment.contentUrl }
      } else {
        logger.warning('[Microsoft] No support for files of type: '.concat(attachment.contentType))
        logger.info('[Microsoft] Defaulting to text')
        if (!message.text || message.text.length <= 0) {
          logger.error('[Microsoft] No text')
          throw new StopPipeline()
        }
        msg.attachment = { type: 'text', content: message.text }
      }
    } else {
      msg.attachment = { type: 'text', content: message.text }
    }
    return msg
  }

  async formatOutgoingMessage (conversation, message, opts) {
    const { type, content } = _.get(message, 'attachment')
    const msg = new Message()
    const mType = _.get(conversation, 'microsoftAddress.channelId', '')

    if (mType === 'teams') {
      opts.allVideosAsLink = true
      opts.allVideosAsLink = true
    }

    const makeCard = (constructor, e) => {
      const res = new constructor()
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
      if (e.onClick) {
        let fun = CardAction.imBack
        if (['web_url', 'account_linking'].indexOf(e.onClick.type) !== -1) {
          fun = CardAction.openUrl
        }
        res.tap(fun(undefined, e.onClick.value, e.onClick.title || ''))
      }
      return res
    }

    if (type === 'text') {
      msg.text(content)
    } else if (type === 'picture' || type === 'video') {
      let hostname = url.parse(content).hostname
      if (hostname.startsWith('www.')) {
        hostname = hostname.slice(4, hostname.length)
      }
      if (type === 'video'
          && (VIDEO_AS_LINK_HOSTS.indexOf(hostname) !== -1
          || opts.allVideosAsLink)) {
        msg.text(content)
      } else {
        const attachment = await microsoftMakeAttachement(content)
        msg.addAttachment(attachment)
      }
    } else if (type === 'quickReplies' || type === 'buttons') {
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

  sendMessage (conversation, message) {
    return new Promise((resolve, reject) => {
      const channel = conversation.channel
      const bot = microsoftGetBot(channel)
      const address = conversation.microsoftAddress
      bot.send(message.address(address), (err) => {
        if (err) {
          return reject(err)
        }
        return resolve()
      })
    })
  }

}
