import filter from 'filter-object'

import {
  invoke,
} from '../utils'

import {
  NotFoundError,
  ConflictError,
} from '../utils/errors'

import {
  renderOk,
  renderCreated,
  renderDeleted,
} from '../utils/responses'

const permitted = '{type,slug,isActivated,token,userName,apiKey,webhook,clientId,clientSecret,botuser,password,phoneNumber,serviceId}'

export default class ChannelsController {

  /**
  * Create a new channel
  */
  static async createChannelByConnectorId (req, res) {
    const { connector_id } = req.params
    const params = filter(req.body, permitted)
    const { slug } = req.body

    const connector = await models.Connector.findById(connector_id).populate('channels')

    if (!connector) { throw new NotFoundError('Connector') }

    let channel = connector.channels.find(c => c.slug === slug)
    if (channel) { throw new ConflictError('Channel slug is already taken') }

    channel = await new models.Channel({ ...params, connector: connector._id })
    channel.webhook = `${config.base_url}/webhook/${channel._id}`
    connector.channels.push(channel._id)

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
  * Index bot's channels
  */
  static async getChannelsByConnectorId (req, res) {
    const { connector_id } = req.params

    const connector = await models.Connector.findById(connector_id)
          .populate('channels')

    if (!connector) { throw new NotFoundError('Connector') }
    if (!connector.channels.length) {
      return renderOk(res, { results: [], message: 'No channels' })
    }

    return renderOk(res, {
      results: connector.channels.map(c => c.serialize),
      message: 'Channels successfully rendered',
    })
  }

  /**
  * Show a channel
  */
  static async getChannelByConnectorId (req, res) {
    const { connector_id, channel_slug } = req.params

    const channel = await models.Channel.findOne({ connector: connector_id, slug: channel_slug })

    if (!channel) { throw new NotFoundError('Channel') }

    return renderOk(res, {
      results: channel.serialize,
      message: 'Channel successfully rendered',
    })
  }

  /**
  * Update a channel
  */
  static async updateChannelByConnectorId (req, res) {
    const { connector_id, channel_slug } = req.params

    const oldChannel = await models.Channel.findOne({ slug: channel_slug, connector: connector_id })

    if (!oldChannel) { throw new NotFoundError('Channel') }

    const channel = await models.Channel.findOneAndUpdate(
      { slug: channel_slug, connector: connector_id },
      { $set: filter(req.body, permitted) },
      { new: true }
    )
    if (!channel) { throw new NotFoundError('Channel') }

    await invoke(channel.type, 'onChannelUpdate', [channel, oldChannel])

    renderOk(res, {
      results: channel.serialize,
      message: 'Channel successfully updated',
    })
  }

  /**
  * Delete a channel
  */
  static async deleteChannelByConnectorId (req, res) {
    const { connector_id, channel_slug } = req.params

    const channel = await models.Channel.findOne({ connector: connector_id, slug: channel_slug })
    if (!channel) { throw new NotFoundError('Channel') }

    await Promise.all([
      channel.remove(),
      invoke(channel.type, 'onChannelDelete', [channel]),
    ])

    renderDeleted(res, 'Channel successfully deleted')
  }
}
