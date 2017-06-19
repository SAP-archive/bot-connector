import _ from 'lodash'
import filter from 'filter-object'

import { invoke } from '../utils'
import { NotFoundError, ConflictError } from '../utils/errors'
import { renderOk, renderCreated, renderDeleted } from '../utils/responses'

const permitted = '{type,slug,isActivated,token,userName,apiKey,webhook,clientId,clientSecret,botuser,password,phoneNumber,serviceId,consumerKey,consumerSecret,accessToken,accessTokenSecret}'
const permittedUpdate = '{slug,isActivated,token,userName,apiKey,webhook,clientId,clientSecret,botuser,password,phoneNumber,serviceId,consumerKey,consumerSecret,accessToken,accessTokenSecret}'

export default class ChannelsController {

  /**
  * Create a new channel
  */
  static async create (req, res) {
    const { connector_id } = req.params
    const params = filter(req.body, permitted)
    const slug = params.slug

    const connector = await models.Connector.findById(connector_id)
      .populate('channels')

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const channel = connector.channels.find(c => c.slug === slug)

    if (channel) {
      throw new ConflictError('Channel slug is already taken')
    }

    channel.webhook = `${global.config.gromit_base_url}/v1/webhook/${channel._id}`
    connector.channels.push(channel)

    await Promise.all([
      connector.save(),
      channel.save(),
    ])

    await invoke(channel.type, 'onChannelCreate', [channel])

    return renderCreated(res, {
      results: channel.serialize,
      message: 'Channel successfully created',
    })
  }

  /**
  * Index channels
  */
  static async index (req, res) {
    const { connector_id } = req.params

    const connector = await models.Connector.findById(connector_id)
      .populate('channels')

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    return renderOk(res, {
      results: connector.channels.map(c => c.serialize),
      message: connector.channels.length ? 'Channels successfully rendered' : 'No channels',
    })
  }

  /**
  * Show a channel
  */
  static async show (req, res) {
    const { connector_id, channel_slug } = req.params

    const channel = models.Channel.findOne({ slug: channel_slug, connector: connector_id })
      .populate('children')

    if (!channel) {
      throw new NotFoundError('Channel')
    }

    return renderOk(res, {
      results: channel.serialize,
      message: 'Channel successfully rendered',
    })
  }

  /**
  * Update a channel
  */
  static async update (req, res) {
    const { connector_id, channel_slug } = req.params

    const oldChannel = await global.models.Channel.findOne({ slug: channel_slug, connector: connector_id })
    const channel = await global.models.Channel.findOneAndUpdate(
      { slug: channel_slug, connector: connector._id, isActive: true },
      { $set: filter(req.body, permittedUpdate) },
      { new: true }
    )

    if (!channel || !oldChannel) {
      throw new NotFoundError('Channel')
    }

    await invoke(channel.type, 'onChannelUpdate', [channel, oldChannel])

    return renderOk(res, {
      results: channel.serialize,
      message: 'Channel successfully updated',
    })
  }

  /**
  * Delete a channel
  */
  static async delete (req, res) {
    const { connector_id, channel_slug } = req.params

    const channel = await models.Channel.findOne({ connector: connector_id, slug: channel_slug })

    if (!channel) {
      throw new NotFoundError('Channel')
    }

    await Promise.all([
      channel.delete(),
      invoke(channel.type, 'onChannelDelete', [channel]),
    ])

    return renderDeleted(res, 'Channel successfully deleted')
  }

}
