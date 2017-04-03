import _ from 'lodash'
import request from 'superagent'

import ServiceTemplate from './Template.service'
import Logger from '../utils/Logger'
import { StopPipeline, NotFoundError, BadRequestError } from '../utils/errors'

export default class SlackAppService extends ServiceTemplate {

  static onChannelCreate (channel) {
    channel.oAuthUrl = `${config.base_url}/oauth/slack/${channel._id}`
    channel.save()
  }

  static async beforePipeline (req, res, channel) {
    /* Verification when filling the event subscription */
    if (req.body && req.body.type === 'url_verification') {
      throw new StopPipeline(req.body.challenge)
    }

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

  static checkParamsValidity (channel) {
    const { clientId, clientSecret } = channel

    if (!clientId) { throw new BadRequestError('Parameter clientId is missing') }
    if (!clientSecret) { throw new BadRequestError('Parameter clientSecret is missing') }

    return true
  }

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

  static async onChannelDelete (channel) {
    for (let child of channel.children) {
      child = await models.Channel.findById(child)
      if (child) { await child.remove() }
    }
  }

  static async receiveOauth (req, res) {
    const { channel_id } = req.params
    const { code } = req.query
    const channel = await models.Channel.findById(channel_id)

    if (!channel) {
      Logger.info(`Received request for oauth but no channel was found for id ${channel_id}`)
      res.status(404).send()
      return
    }
    res.status(200).send()

    request.post(`https://slack.com/api/oauth.access?client_id=${channel.clientId}&client_secret=${channel.clientSecret}&code=${code}`)
      .end((err, res) => {
        if (err || res.body.ok === false) {
          Logger.error('Failed to identify to slack oauth')
        } else {
          const token = res.body.bot.bot_access_token
          new models.Channel({
            token,
            type: 'slack',
            slug: res.body.team_id,
            isActivated: true,
            connector: channel.connector,
            botuser: res.body.bot.bot_user_id,
            app: channel_id,
          }).save()
            .then(channelChild => {
              channel.children.push(channelChild._id)
              channel.save()
            })
            .catch(err => {
              Logger.error(`An error occured while creating channel: ${err}`)
            })
        }
      })
  }
}
