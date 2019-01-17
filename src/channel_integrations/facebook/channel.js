/* eslint no-unused-vars: ["error", { "ignoreRestSiblings": true }] */
import _ from 'lodash'
import config from '../../../config'
import AbstractChannelIntegration from '../abstract_channel_integration'
import {
  BadRequestError,
  ForbiddenError,
  getWebhookToken,
  logger,
  StopPipeline,
} from '../../utils'
import {
  facebookGetAppWebhookToken,
  facebookGetUserData,
  facebookSendMessage,
  facebookSendIsTyping,
  facebookAddAppToPage,
  facebookRemoveAppFromPage,
  facebookComputeSignature,
  facebookAddProfileProperties,
  facebookDelProfileProperties,
} from './sdk'
import { facebookCodesMap } from './constants'
import { GetStartedButton, PersistentMenu } from '../../models'

export default class Messenger extends AbstractChannelIntegration {

  validateChannelObject (channel) {
    if (!channel.token) {
      throw new BadRequestError('Parameter token is missing')
    } else if (!channel.apiKey && !channel.serviceId) {
      /* 1-click messenger integration
         serviceId is a facebook page id
         the apiKey (app secret) is not needed anymore since we use
         our app with its corresponding secret
         We check for both, waiting for frontend implementation */
      throw new BadRequestError('Parameter apiKey or serviceId is missing')
    }
  }

  async beforeChannelCreated (channel) {
    /* 1-click messenger integration
       This subscribes SAP Conversational AI facebook App to the user page
       so gromit can receive the messages */
    const { serviceId: pageId, token: pageToken } = channel
    if (pageId) {
      await facebookAddAppToPage(pageId, pageToken)
    }
  }

  async afterChannelUpdated (channel, oldChannel) {
    await this.afterChannelDeleted(oldChannel)
    await this.beforeChannelCreated(channel)
  }

  async afterChannelDeleted (channel) {
    /* 1-click messenger integration
       This removes SAP Conversational AI facebook App subscription to the user page
       so gromit doesn't receive the messages anymore */
    const { serviceId: pageId, token: pageToken } = channel
    if (pageId) {
      await facebookRemoveAppFromPage(pageId, pageToken)
    }
  }

  buildWebhookUrl (channel) {
    const { serviceId: pageId } = channel
    if (pageId) {
      /* 1-click messenger integration
         add the shared messenger webhook endpoint to the channel */
      return `${config.base_url}/v1/webhook/service/messenger`
    }
    return super.buildWebhookUrl(channel)
  }

  static webHookCheck (req, res, token) {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === token) {
      res.status(200).send(req.query['hub.challenge'])
    } else {
      throw new BadRequestError('Error while checking the webhook validity')
    }
  }

  onSharedWebhookChecking (req, res) {
    Messenger.webHookCheck(req, res, facebookGetAppWebhookToken())
  }

  getIdPairsFromSharedWebhook (req) {
    const serviceId = _.get(req, 'body.entry[0].messaging[0].recipient.id', null)
    if (serviceId) {
      return { serviceId }
    }
  }

  validateWebhookSubscriptionRequest (req, res, channel) {
    Messenger.webHookCheck(req, res, getWebhookToken(channel._id, channel.slug))
  }

  async authenticateWebhookRequest (req, res, channel) {
    const rawBody = _.get(req, 'rawBody')
    const signature = _.get(req, ['headers', 'x-hub-signature'])

    const serviceId = _.get(channel, 'serviceId')
    /* 1-click messenger integration
       If there is a pageId, we are in new mode
       the secret will be directly fetched by the signature function */
    const appSecret = serviceId ? null : _.get(channel, 'apiKey')
    const calculated = facebookComputeSignature(rawBody, appSecret)
    if (calculated !== signature) {
      throw new ForbiddenError()
    }
  }

  async onWebhookCalled (req, res, channel) {
    // send 200 OK early so that Facebook doesn't retry our web hook after 20s
    // because sometimes we take more than that to produce and send a bot response back to Slack
    res.status(200).json({ results: null, message: 'Message successfully received' })
    return channel
  }

  finalizeWebhookRequest () {
    // do nothing as 200 OK has already been sent
  }

  populateMessageContext (req) {
    const recipientId = _.get(req, 'body.entry[0].messaging[0].recipient.id')
    const senderId = _.get(req, 'body.entry[0].messaging[0].sender.id')

    return {
      chatId: `${recipientId}-${senderId}`,
      senderId,
    }
  }

  onIsTyping (channel, context) {
    const { senderId } = context
    const { token: pageToken, apiKey: appSecret } = channel
    return facebookSendIsTyping(senderId, pageToken, appSecret)
  }

  parseIncomingMessage (conversation, message) {
    const msg = {}
    message = _.get(message, 'entry[0].messaging[0]')
    const type = _.get(message, 'message.attachments[0].type')
    const quickReply = _.get(message, 'message.quick_reply.payload')

    if (message.account_linking) {
      const { status, authorization_code } = _.get(message, 'account_linking')
      msg.attachment = { type: 'account_linking', status, content: authorization_code }
    } else if (message.postback) {
      const content = _.get(message, 'postback.payload')
      msg.attachment = { type: 'payload', content }
    } else if (message.referral) {
      msg.attachment = { type: 'referral', content: message.referral }
    } else if (!message.message || (message.message.is_echo && message.message.app_id)) {
      throw new StopPipeline()
    } else if (type) {
      const attachment = _.get(message, 'message.attachments[0]')
      // fallback type for an attachment is a link fetched by facebook and
      // displayed in a special fashion (can be a video, an image...)
      const content = _.get(attachment, (type === 'fallback') ? 'url' : 'payload.url')
      msg.attachment = {
        type: type === 'image' ? 'picture' : type,
        content,
      }
    } else if (quickReply) {
      msg.attachment = { type: 'text', content: quickReply, is_button_click: true }
    } else {
      const content = _.get(message, 'message.text')
      msg.attachment = { type: 'text', content }
    }

    if (message.message && message.message.is_echo) {
      _.set(msg, 'attachment.isEcho', true)
      if (!message.message.app_id) {
        _.set(msg, 'attachment.isAdminMessage', true)
      }
    }

    return msg
  }

  static formatButtons (buttons) {
    return buttons.map(button => {
      const { title } = button
      const type = button.type || 'text'
      const value = button.value || button.url

      if (['account_linking', 'account_link'].indexOf(type) !== -1) {
        return { type: 'account_link', title, url: value }
      } else if (type === 'web_url') {
        return { type, title, url: value }
      } else if (type === 'phonenumber') {
        return { type: 'phone_number', title, payload: value }
      } else if (['postback', 'phone_number', 'element_share'].indexOf(type) !== -1) {
        return { type, title, payload: value }
      }
      return { type }
    })
  }

  formatOutgoingMessage (conversation, message, opts) {
    // https://developers.facebook.com/docs/messenger-platform/send-messages
    const { type, content } = _.get(message, 'attachment')
    const msg = {
      recipient: { id: opts.senderId },
      message: {},
      messaging_type: 'RESPONSE',
    }

    switch (type) {
    case 'text':
      _.set(msg, 'message', { text: content })
      break
    case 'video':
    case 'picture':
    case 'audio': // Special case needed for StarWars ?
      _.set(msg, 'message.attachment.type', type === 'picture' ? 'image' : type)
      _.set(msg, 'message.attachment.payload.url', content)
      break
    case 'card':
      // FIXME: FB messenger only supports up to 3 buttons on a card
      // https://developers.facebook.com/docs/messenger-platform/reference/template/generic#elements
      const {
        title,
        itemUrl: item_url,
        imageUrl: image_url,
        subtitle } = _.get(message, 'attachment.content', {})
      const buttons = Messenger.formatButtons(_.get(message, 'attachment.content.buttons', []))

      _.set(msg, 'message.attachment.type', 'template')
      _.set(msg, 'message.attachment.payload.template_type', 'generic')
      _.set(msg,
        'message.attachment.payload.elements',
        [{ title, item_url, image_url, subtitle, buttons }])
      break
    case 'quickReplies':
      // FIXME: FB messenger only supports up to 11 quick reply buttons
      // https://developers.facebook.com/docs/messenger-platform/reference/send-api/quick-replies
      const text = _.get(message, 'attachment.content.title', '')
      const quick_replies = _.get(message, 'attachment.content.buttons', [])
        .map(b => ({ content_type: 'text', title: b.title, payload: b.value }))

      _.set(msg, 'message', { text, quick_replies })
      break
    case 'list': {
      const rawElements = _.get(message, 'attachment.content.elements', [])
      const elements = rawElements.map(e => ({
        title: e.title,
        image_url: e.imageUrl,
        subtitle: e.subtitle,
        buttons: e.buttons && Messenger.formatButtons(e.buttons),
      }))

      // FB Messenger only supports lists with 2 - 4 elements
      // workaround so this doesn't result in an error but we still are
      // successful and not block following messages
      // (FB would just retry the failed message over and over if status code != 200)
      // https://developers.facebook.com/docs/messenger-platform/send-messages/template/list
      if (elements.length < 2) {
        // if list has only one element, send success instead of failing later
        logger.error(`[Facebook Messenger] Channel ${conversation.channel.id} tried to send a list `
                     + 'with less than 2 elements. List not sent.')
        throw new StopPipeline()
      } else if (elements.length > 4) {
        // only take the first four elements of the list
        elements.splice(4)
        logger.error(`[Facebook Messenger] Channel ${conversation.channel.id} tried to send a list `
                     + 'with more than 4 elements. Last elements omitted.')
      }

      const payload = { template_type: 'list', elements }

      // In normal conditions, the first image must always have an image
      if (rawElements.length > 0 && !('imageUrl' in rawElements[0])) {
        payload.top_element_style = 'compact'
      }

      const buttons = Messenger.formatButtons(_.get(message, 'attachment.content.buttons', []))
      if (buttons.length > 0) {
        _.set(msg, 'message.attachment.payload.buttons', buttons)
      }

      _.set(msg, 'message.attachment.type', 'template')
      _.set(msg, 'message.attachment.payload', payload)
      break
    }
    case 'carousel':
    case 'carouselle':
      // FIXME: FB messenger only supports up to 10 carousel elements
      // https://developers.facebook.com/docs/messenger-platform/reference/template/generic#payload
      const elements = _.get(message, 'attachment.content', [])
          .map(content => {
            const { title, itemUrl: item_url, imageUrl: image_url, subtitle } = content
            const buttons = Messenger.formatButtons(_.get(content, 'buttons', []))
            const element = { title, subtitle, item_url, image_url }

            if (buttons.length > 0) {
              _.set(element, 'buttons', buttons)
            }

            return element
          })

      if (elements.splice(10).length !== 0) {
        logger.error(`[Facebook Messenger] Channel ${conversation.channel.id} tried to
        send a carousel with more than 10 elements. Last elements omitted.`)
      }

      _.set(msg, 'message.attachment.type', 'template')
      _.set(msg, 'message.attachment.payload.template_type', 'generic')
      _.set(msg, 'message.attachment.payload.elements', elements)
      break
    case 'buttons': {
      // FIXME: FB messenger only supports up to 3 buttons
      // https://developers.facebook.com/docs/messenger-platform/reference/template/button#payload
      const text = _.get(message, 'attachment.content.title', '')
      const payload = { template_type: 'button', text }

      _.set(msg, 'message.attachment.type', 'template')
      _.set(msg, 'message.attachment.payload', payload)

      const buttons = Messenger.formatButtons(_.get(message, 'attachment.content.buttons', []))
      if (buttons.length > 0) {
        _.set(msg, 'message.attachment.payload.buttons', buttons)
      }
      break
    }
    case 'custom':
      _.set(msg, 'message', content)
      break
    default:
      throw new BadRequestError('Message type non-supported by Messenger')
    }

    return msg
  }

  async sendMessage (conversation, message) {
    const { channel: { token: pageToken, apiKey: appSecret } } = conversation
    await facebookSendMessage(message, pageToken, appSecret)
  }

  /*
   * Gromit methods
   */

  async populateParticipantData (participant, channel) {
    const fields = 'first_name,last_name,profile_pic,locale,timezone,gender'
    const { token: pageToken, apiKey: appSecret } = channel
    const { id, ...participantData }
      = await facebookGetUserData(participant.senderId, pageToken, fields, appSecret)
    participant.data = participantData
    participant.markModified('data')
    return participant.save()
  }

  parseParticipantDisplayName (participant) {
    const informations = {}

    if (participant.data) {
      const { first_name, last_name } = participant.data
      informations.userName = `${first_name} ${last_name}`
    }

    return informations
  }

  formatItems (menu) {
    menu.call_to_actions.map(item => {
      if (item.type === 'Link') {
        item.type = 'web_url'
        item.url = item.payload
        delete item.payload
      } else if (item.type === 'nested') {
        this.formatItems(item)
      }
      return item
    })
  }

  formatPersistentMenu (menus) {
    const persistent_menu = menus.reduce((formattedMenus, currentMenu) => {
      // copying currentMenu.menu into currentFormattedMenu to not modify the currentMenu
      const currentFormattedMenu = JSON.parse(JSON.stringify(currentMenu.menu))
      if (!facebookCodesMap[currentMenu.locale]) {
        throw new BadRequestError('Language non-supported by Messenger')
      }
      if (currentMenu.default === true) {
        currentFormattedMenu.locale = 'default'
      } else {
        currentFormattedMenu.locale = facebookCodesMap[currentMenu.locale]
      }
      currentFormattedMenu.composer_input_disabled = false
      this.formatItems(currentFormattedMenu)
      formattedMenus.push(currentFormattedMenu)
      return formattedMenus
    }, [])
    return persistent_menu
  }

  async setGetStartedButton (channel, value, connector = null) {
    const pageToken = channel.token
    const properties = {
      get_started: { payload: value },
      persistent_menu: [],
    }
    if (connector) {
      const menus = await PersistentMenu.find({ connector_id: connector._id })
      if (menus.length) {
        properties.persistent_menu = this.formatPersistentMenu(menus)
      }
    }
    await facebookAddProfileProperties(properties, pageToken)
  }

  async deleteGetStartedButton (channel) {
    const pageToken = channel.token
    const property = ['get_started', 'persistent_menu']

    await facebookDelProfileProperties(property, pageToken)
  }

  /**
   * format all the menus and send it to facebook
   * Sets the locale to default or to the corresponding facebook code
   * @param {channel} an instance of the channel model
   * @param {menus} an array of PersistentMenu
   * @returns undefined
   */
  async setPersistentMenu (channel, menus) {
    // setting persistent menu only if the channel has a get started button
    if (!await GetStartedButton.findOne({ channel_id: channel._id })) {
      return
    }
    const pageToken = channel.token
    const property = { persistent_menu: [] }
    property.persistent_menu = this.formatPersistentMenu(menus)
    await facebookAddProfileProperties(property, pageToken)
  }

  async deletePersistentMenu (channel) {
    const pageToken = channel.token
    const property = ['persistent_menu']
    await facebookDelProfileProperties(property, pageToken)
  }
}
