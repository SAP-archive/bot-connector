import filter from 'filter-object'

import * as channelConstants from '../constants/channels'
import { NotFoundError, ConflictError } from '../utils/errors'
import { renderOk, renderCreated, renderDeleted } from '../utils/responses'
import { Channel, Connector } from '../models'
import { getChannelIntegrationByIdentifier } from '../channel_integrations'

export default class ChannelsController {

  /**
  * Create a new channel
  */
  static async create (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })

    const params = filter(req.body, channelConstants.permitted)
    const slug = params.slug

    if (!connector) {
      throw new NotFoundError('Connector')
    } else if (await Channel.findOne({
      connector: connector._id,
      isActive: true,
      slug })) {
      throw new ConflictError('Channel slug is already taken')
    }
    const channel = await new Channel({ ...params,
      connector: connector._id })
    const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
    channel.webhook = channelIntegration.buildWebhookUrl(channel)
    await channelIntegration.beforeChannelCreated(channel, req)
    await channel.save()
    await channelIntegration.afterChannelCreated(channel, req)

    return renderCreated(res, {
      results: channel.serialize,
      message: 'Channel successfully created',
    })
  }

  /**
  * Index channels
  */
  static async index (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const channels = await Channel.find({
      connector: connector._id,
    })

    return renderOk(res, {
      results: channels.map(c => c.serialize),
      message: channels.length ? 'Channels successfully rendered' : 'No channels',
    })
  }

  /**
  * Show a channel
  */
  static async show (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    const channel_slug = req.params.channel_slug

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const channel = await Channel.findOne({
      slug: channel_slug,
      connector: connector._id,
      isActive: true,
    }).populate('children')

    if (!channel) {
      throw new NotFoundError('Channel')
    }

    return renderOk(res, {
      results: channel.serialize,
      message: 'Channel successfully rendered',
    })
  }

  /**
  * Index a channel's redirection_groups
  */
  static async getCRMRedirectionGroups (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    const channel_slug = req.params.channel_slug

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const channel = await Channel.findOne({
      slug: channel_slug,
      connector: connector._id,
      isActive: true,
    })

    if (!channel) {
      throw new NotFoundError('Channel')
    }
    const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
    const redirectionGroups = await channelIntegration.getCRMRedirectionGroups(channel)
    return renderOk(res, {
      results: redirectionGroups,
      message: 'Redirection groups successfully rendered',
    })
  }

  /**
  * Update a channel
  */
  static async update (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    const channel_slug = req.params.channel_slug
    const slug = req.body.slug
    const params = filter(req.body, channelConstants.permittedUpdate)

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const oldChannel = await Channel
      .findOne({ connector: connector._id, isActive: true, slug: channel_slug })

    if (slug && slug !== channel_slug && await Channel.findOne({
      connector: connector._id,
      isActive: true,
      slug,
    })) {
      throw new ConflictError('Channel slug is already taken')
    }

    const channel = await Channel.findOneAndUpdate(
      { slug: channel_slug, connector: connector._id, isActive: true },
      { $set: { ...params } },
      { new: true }
    )

    if (!channel) {
      throw new NotFoundError('Channel')
    }
    const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
    await channelIntegration.afterChannelUpdated(channel, oldChannel)

    return renderOk(res, {
      results: channel.serialize,
      message: 'Channel successfully updated',
    })
  }

  /**
  * Delete a channel
  */
  static async delete (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    const channel_slug = req.params.channel_slug

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const channel = await Channel
      .findOne({ connector: connector._id, isActive: true, slug: channel_slug })
    if (!channel) {
      throw new NotFoundError('Channel')
    }
    const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
    await channelIntegration.beforeChannelDeleted(channel)

    channel.isActive = false
    await Promise.all([
      channel.save(),
      channelIntegration.afterChannelDeleted(channel),
    ])

    return renderDeleted(res, 'Channel successfully deleted')
  }

}
