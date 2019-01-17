import _ from 'lodash'
import superagent from 'superagent'
import superagentPromise from 'superagent-promise'

import AbstractChannelIntegration from '../abstract_channel_integration'
import { Channel } from '../../models'
import { slugify } from '../../models/channel'
import { StopPipeline, NotFoundError, BadRequestError } from '../../utils/errors'
import * as config from '../../../config'

const agent = superagentPromise(superagent, Promise)

export default class SlackAppChannel extends AbstractChannelIntegration {

  populateMessageContext (req) {
    return {
      chatId: _.get(req, 'body.event.channel'),
      senderId: _.get(req, 'body.event.user'),
    }
  }

  validateChannelObject (channel) {
    if (!channel.clientId) {
      throw new BadRequestError('Parameter clientId is missing')
    } else if (!channel.clientSecret) {
      throw new BadRequestError('Parameter clientSecret is missing')
    }
  }

  async beforeChannelCreated (channel) {
    channel.oAuthUrl = `${config.base_url}/v1/oauth/slack/${channel._id}`
    return channel.save()
  }

  async afterChannelDeleted (channel) {
    for (let child of channel.children) {
      child = await Channel.findById(child)
      if (child) { await child.remove() }
    }
  }

  authenticateWebhookRequest (req) {
    if (req.body && req.body.type === 'url_verification') {
      throw new StopPipeline(req.body.challenge)
    }
  }

  async onWebhookCalled (req, res, channel) {
    // send 200 OK early so that Slack doesn't retry our web hook after 3s
    // because sometimes we take more than 3s to produce and send a bot response back to Slack
    res.status(200).send()

    /* handle action (buttons) to format them */
    if (req.body.payload) {
      req.body = SlackAppChannel.parsePayload(req.body)
    }

    /* Search for the App children */
    // slugify the slug as well to support channels created before slug was slugified on save
    channel = _.find(
      channel.children, child => slugify(child.slug) === slugify(req.body.team_id)
    )
    if (!channel) { throw new NotFoundError('Channel') }

    /* check if event is only message */
    if (channel.type === 'slack'
        && req.body
        && req.body.event
        && req.body.event.type !== 'message') {
      throw new StopPipeline()
    }

    /* check if sender is the bot */
    if (req.body.event.user === channel.botuser) {
      throw new StopPipeline()
    }

    return channel
  }

  finalizeWebhookRequest (req, res) {
    res.status(200).send()
  }

  /*
   * SlackApp specific methods
   */

  static parsePayload (body) {
    const parsedBody = JSON.parse(body.payload)

    return ({
      team_id: parsedBody.team.id,
      token: parsedBody.token,
      event: {
        type: 'message',
        is_button_click: parsedBody.actions[0].type === 'button',
        user: parsedBody.user.id,
        text: parsedBody.actions[0].value,
        ts: parsedBody.action_ts,
        channel: parsedBody.channel.id,
        event_ts: parsedBody.action_ts,
      },
      type: 'event_callback',
    })
  }

  static async receiveOauth (req, res) {
    const { channel_id } = req.params
    const { code } = req.query
    const channel = await Channel.findById(channel_id)

    if (!channel) {
      throw new NotFoundError('Channel')
    }

    let response
    try {
      response = await agent.post('https://slack.com/api/oauth.access')
                            .query({ client_id: channel.clientId })
                            .query({ client_secret: channel.clientSecret })
                            .query({ code })
    } catch (err) {
      throw new Error(`[Slack] Failed oAuth subscription: ${err.message}`)
    }

    const { body } = response
    if (!body.ok) {
      throw new Error(`[Slack] Failed oAuth subscription: ${body.error}`)
    }

    try {
      const channelChild = await new Channel({
        type: 'slack',
        app: channel_id,
        slug: body.team_id,
        connector: channel.connector,
        botuser: body.bot.bot_user_id,
        token: body.bot.bot_access_token,
      })
      channel.children.push(channelChild._id)

      await Promise.all([
        channelChild.save(),
        channel.save(),
      ])
    } catch (err) {
      throw new Error(`Error storing Mongoose model for Slack channel child: ${err.message}`)
    }

    let url = `${config.cody_base_url}/`

    if (req.query.state) {
      const infosSlugEncoded = Buffer.from(req.query.state, 'base64')
      const infosSlugDecoded = JSON.parse(infosSlugEncoded.toString('utf8'))
      const { userSlug, botSlug } = infosSlugDecoded
      url = `${config.cody_base_url}/${userSlug}/${botSlug}/connect/?slack=success`
    }
    res.redirect(url)
  }
}
