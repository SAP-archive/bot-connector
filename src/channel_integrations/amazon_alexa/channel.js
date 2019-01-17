import lwa from 'login-with-amazon'
import _ from 'lodash'
import { SkillBuilders } from 'ask-sdk'

import config from '../../../config'
import { logger, AppError, BadRequestError } from '../../utils'
import AbstractChannelIntegration from '../abstract_channel_integration'
import AlexaSMAPI from './sdk.js'

/*
 * getWebhookUrl: default
 */
export default class AmazonAlexa extends AbstractChannelIntegration {

  static REQUEST_LAUNCH = 'LaunchRequest'
  static SESSION_ENDED_REQUEST = 'SessionEndedRequest'
  static INTENT_REQUEST = 'IntentRequest'
  static CATCH_ALL_INTENT = 'CATCH_ALL_INTENT'
  static CATCH_ALL_SLOT = 'CATCH_ALL_SLOT'

  // Special Alexa Intent types
  static CONVERSATION_START = 'CONVERSATION_START'
  static CONVERSATION_END = 'CONVERSATION_END'

  // Special Memory flag to end conversation
  static END_CONVERSATION = 'END_CONVERSATION'

  static supportedLocales = AlexaSMAPI.locales

  // [START] Inherited from AbstractChannelIntegration

  async beforeChannelCreated (channel) {
    // Exchange the OAuth Code for Access Token and Refresh Token
    const { access_token, refresh_token } = await lwa.getAccessTokens(
      channel.oAuthCode, config.amazon_client_id, config.amazon_client_secret)
    channel.oAuthTokens = { access_token, refresh_token }
    await channel.save()
  }

  async beforeChannelDeleted (channel) {
    if (!channel.skillId) {
      // Don't do anything if it has not been deployed to Amazon Alexa
      return
    }

    try {
      await this.smapiCallWithAutoTokenRefresh(channel, 'deleteSkill', channel.skillId)
    } catch (sdkError) {
      const { message, status } = sdkError
      if (status === 404) {
        // If the Skill has been deleted in the Amazon Alexa Console, ignore the error
        return
      }
      throw new AppError(message, null, status)
    }
  }

  async parseIncomingMessage (conversation, message, opts) {
    try {
      // Workaround for passing on the Response Builder since the ASK SDK wraps it into an object
      // eslint-disable-next-line max-len
      // https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/blob/2.0.x/ask-sdk-core/lib/skill/Skill.ts#L93
      const alexaResponse = await AmazonAlexa.skill.invoke(message)

      // Extract msg (for Bot Builder) and responseBuilder (for Alexa response)
      const { response: { msg, responseBuilder } } = alexaResponse
      // Delete the current response object
      delete alexaResponse.response
      _.set(opts, 'responseBuilder', responseBuilder)
      _.set(opts, 'alexaResponseTemplate', alexaResponse)
      return msg
    } catch (err) {
      logger.error(`[Amazon Alexa] Error invoking skill: ${err}`)
      throw err
    }
  }

  populateMessageContext (req) {
    const chatId = _.get(req, 'body.session.sessionId')
    const senderId = _.get(req, 'body.session.user.userId')
    if (_.isNil(chatId) || _.isNil(senderId)) {
      throw new BadRequestError('Invalid sessionId or userId', { chatId, senderId })
    }
    return { chatId, senderId }
  }

  finalizeWebhookRequest (req, res, context, replies) {
    if (!_.isEmpty(replies)) {
      return res.status(200).json(_.head(replies))
    }
    const emptyResponse = _.get(context, 'alexaResponseTemplate', {})
    _.set(emptyResponse, 'response', {})
    res.status(200).send(emptyResponse)
  }

  formatOutgoingMessage (conversation, message, context) {
    const { attachment: { type, content } } = message

    if (!_.includes(['text', 'card'], type)) {
      throw Error(`[Amazon Alexa] Unsupported response type: ${type}`)
    }

    // Special memory flag to end Alexa conversation (session)
    const shouldEndSession = _.get(context, ['memory', AmazonAlexa.END_CONVERSATION], false)

    // Prepared Alexa response format from Skill invocation
    const alexaResponseTemplate = _.get(context, 'alexaResponseTemplate', {})

    let response = {}
    try {
      if (type === 'text') {
        response = context.responseBuilder
                           .speak(content)
                           .withShouldEndSession(shouldEndSession)
                           .getResponse()
      }
      if (type === 'card') {
        const { title: cardTitle, subtitle: cardContent, imageUrl: largeImageUrl } = content

        if (largeImageUrl) {
          // 1. case: Standard Card with image
          response = context.responseBuilder
                        .speak(content)
                        .withStandardCard(cardTitle, cardContent, largeImageUrl)
                        .withShouldEndSession(false)
                        .getResponse()
        } else if (cardContent === 'account_linking') {
          // 2. case: Account Linking
          response = context.responseBuilder
                        .speak(content)
                        .withLinkAccountCard()
                        .withShouldEndSession(false)
                        .getResponse()
        }
        // Default case: Simple Card
        response = context.responseBuilder
                      .speak(content)
                      .withSimpleCard(cardTitle, cardContent)
                      .withShouldEndSession(false)
                      .getResponse()
      }
    } catch (err) {
      logger.error(`[Amazon Alexa] Error creating outgoing message: ${err}`)
      throw err
    }
    _.set(alexaResponseTemplate, 'response', response)
    return alexaResponseTemplate
  }

  // [END] Inherited from AbstractChannelIntegration

  static LaunchRequestHandler = {
    canHandle: (input) => input.requestEnvelope.request.type === AmazonAlexa.REQUEST_LAUNCH,
    handle: (input) => {
      return {
        msg: {
          attachment: {
            content: AmazonAlexa.CONVERSATION_START,
            type: AmazonAlexa.CONVERSATION_START,
          },
        },
        responseBuilder: input.responseBuilder,
      }
    },
  }

  static SessionEndedRequestHandler = {
    canHandle: (input) => input.requestEnvelope.request.type === AmazonAlexa.SESSION_ENDED_REQUEST,
    handle: (input) => {
      return {
        msg: {
          attachment: {
            content: null,
            type: AmazonAlexa.CONVERSATION_END,
          },
        },
        responseBuilder: input.responseBuilder,
      }
    },
  }

  static CatchAllHandler = {
    canHandle: (input) => input.requestEnvelope.request.type === AmazonAlexa.INTENT_REQUEST
      && input.requestEnvelope.request.intent.name === AmazonAlexa.CATCH_ALL_INTENT,
    handle: (input) => {
      return {
        msg: {
          attachment: {
            content: _.get(input, ['requestEnvelope', 'request', 'intent', 'slots',
              AmazonAlexa.CATCH_ALL_SLOT, 'value']),
            type: 'text',
          },
        },
        responseBuilder: input.responseBuilder,
      }
    },
  }

  static skill = SkillBuilders.custom()
    .addRequestHandlers(AmazonAlexa.LaunchRequestHandler,
                        AmazonAlexa.SessionEndedRequestHandler,
                        AmazonAlexa.CatchAllHandler)
    .create()

  async refreshAccessToken (channel) {
    const { refresh_token } = channel.oAuthTokens
    try {
      const response = await lwa.refreshAccessToken(
        refresh_token, config.amazon_client_id, config.amazon_client_secret)
      channel.oAuthTokens.access_token = response.access_token
      await channel.save()
    } catch (err) {
      logger.error(`[Amazon Alexa] Error refreshing access token: ${err}`)
      throw err
    }
  }

  async smapiCallWithAutoTokenRefresh (channel, func, ...params) {
    let smapi = new AlexaSMAPI(channel.oAuthTokens.access_token)
    try {
      const response = await smapi[func](...params)
      return response
    } catch (err) {
      if (err.status === 401) {
        await this.refreshAccessToken(channel)
        smapi = new AlexaSMAPI(channel.oAuthTokens.access_token)
        return smapi[func](...params)
      }
      throw err
    }
  }

  async getVendors (channel) {
    try {
      const vendors = await this.smapiCallWithAutoTokenRefresh(channel, 'getVendors')
      return vendors
    } catch (sdkError) {
      const { message, status } = sdkError
      throw new AppError(message, null, status)
    }
  }

  async deploy (channel, { vendor = null, locales = [], isUpdate = false }) {
    channel.invocationName = this.convertInvocationName(channel.invocationName)
    channel.vendor = vendor
    channel.locales = locales

    const skillManifest = this.createSkillManifest(channel)
    const interactionModel = this.createInteractionModel(channel.invocationName)

    try {
      if (isUpdate) {
        await this.smapiCallWithAutoTokenRefresh(
          channel, 'updateSkill', channel.skillId, skillManifest)
      } else {
        const { body: { skillId } } = await this.smapiCallWithAutoTokenRefresh(
          channel, 'createSkill', channel.vendor, skillManifest)
        channel.skillId = skillId
      }

      for (const locale of channel.locales) {
        await this.smapiCallWithAutoTokenRefresh(
          channel, 'updateInteractionModel', channel.skillId, locale, interactionModel)
      }
      await channel.save()
    } catch (sdkError) {
      const { message, status } = sdkError
      throw new AppError(message, null, status)
    }
  }

  createPublishingInformationByLocal (channel) {
    const publishingInformation = {}
    for (const locale of channel.locales) {
      publishingInformation[locale] = {
        name: channel.slug,
        summary: 'This is an Alexa custom skill using SAP Conversational AI.',
        description: 'This skill can leverage all the power of SAP Conversational AI.',
        examplePhrases: [
          `Alexa, ask ${channel.invocationName}.`,
          `Alexa, begin ${channel.invocationName}.`,
          `Alexa, do ${channel.invocationName}.`,
        ],
      }
    }
    return publishingInformation
  }

  createPrivacyAndComplianceByLocal (channel) {
    const privacyAndCompliance = {}
    for (const locale of channel.locales) {
      privacyAndCompliance[locale] = {
        privacyPolicyUrl: 'http://www.myprivacypolicy.sampleskill.com',
        termsOfUseUrl: 'http://www.termsofuse.sampleskill.com',
      }
    }
    return privacyAndCompliance
  }

  createSkillManifest (channel) {
    return {
      publishingInformation: {
        locales: this.createPublishingInformationByLocal(channel),
        isAvailableWorldwide: false,
        category: 'NOVELTY',
        distributionCountries: ['US'],
      },
      apis: {
        custom: {
          endpoint: {
            sslCertificateType: 'Wildcard',
            uri: channel.webhook,
          },
        },
      },
      manifestVersion: '1.0',
      permissions: [],
      privacyAndCompliance: {
        allowsPurchases: false,
        usesPersonalInfo: false,
        isChildDirected: false,
        isExportCompliant: false,
        containsAds: false,
        locales: this.createPrivacyAndComplianceByLocal(channel),
      },
    }
  }

  createInteractionModel (invocationName) {
    return {
      languageModel: {
        invocationName,
        intents: [
          {
            name: 'CATCH_ALL_INTENT',
            slots: [
              {
                name: 'CATCH_ALL_SLOT',
                type: 'CATCH_ALL_SLOT_TYPE',
              },
            ],
            samples: [
              '{CATCH_ALL_SLOT}',
            ],
          },
        ],
        types: [
          {
            name: 'CATCH_ALL_SLOT_TYPE',
            values: [
              {
                name: {
                  value: 'CATCH_ALL_SLOT_VALUE',
                },
              },
            ],
          },
        ],
      },
    }
  }

  convertInvocationName (invocationName) {
  // Invocation name must start with a letter and can only contain lower case
  // letters, spaces, apostrophes, and periods.
    return invocationName.replace(/[^a-zA-Z ]/g, '').toLowerCase()
  }
}
