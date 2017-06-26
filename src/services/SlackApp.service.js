import _ from 'lodash'
import superagent from 'superagent'
import superagentPromise from 'superagent-promise'

import ServiceTemplate from './Template.service'
import { StopPipeline, NotFoundError, BadRequestError } from '../utils/errors'

const agent = superagentPromise(superagent, Promise)

/*
 * checkParamsValidity: ok
 * onChannelCreate: ok
 * onChannelUpdate: default
 * onChannelDelete: ok
 * onWebhookChecking: default
 * checkSecurity: ok
 * beforePipeline: ok
 * extractOptions: default
 * getRawMessage: default
 * sendIsTyping: default
 * updateConversationWithMessage: default
 * parseChannelMessage: default
 * formatMessage: ok
 * sendMessage: ok
 */

export default class SlackAppService extends ServiceTemplate {

  static checkParamsValidity (channel) {
    if (!channel.clientId) {
      throw new BadRequestError('Parameter clientId is missing')
    } else if (!channel.clientSecret) {
      throw new BadRequestError('Parameter clientSecret is missing')
    }
  }

  static onChannelCreate (channel) {
    channel.oAuthUrl = `${config.gromit_base_url}/v1/oauth/slack/${channel._id}`
    channel.save()
  }

  static async onChannelDelete (channel) {
    for (let child of channel.children) {
      child = await models.Channel.findById(child)
      if (child) { await child.remove() }
    }
  }

  static checkSecurity (req, res) {
    if (req.body && req.body.type === 'url_verification') {
      throw new StopPipeline(req.body.challenge)
    }

    res.status(200).send()
  }

  static async beforePipeline (req, res, channel) {
    /* handle action (buttons) to format them */
    if (req.body.payload) {
      req.body = SlackAppService.parsePayload(req.body)
    }

    /* Search for the App children */
    channel = _.find(channel.children, child => child.slug === req.body.team_id)
    if (!channel) { throw new NotFoundError('Channel') }

    /* check if event is only message */
    if (channel.type === 'slack' && req.body && req.body.event && req.body.event.type !== 'message') {
      throw new StopPipeline()
    }

    /* check if sender is the bot */
    if (req.body.event.user === channel.botuser) {
      throw new StopPipeline()
    }

    return channel
  }

  /*
   * SlackApp specifif methods
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
    const channel = await models.Channel.findById(channel_id)

    if (!channel) {
      throw new NotFoundError('Channel not found')
    }

    try {
      const { body } = await agent.post(`https://slack.com/api/oauth.access?client_id=${channel.clientId}&client_secret=${channel.clientSecret}&code=${code}`)
      if (!body.ok) { throw new Error() }
      res.status(200).send()

      const channelChild = await new models.Channel({
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
      throw new BadRequestError('[Slack] Failed oAuth subscription')
    }
  }

}
