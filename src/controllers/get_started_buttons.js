import { renderOk, renderCreated, renderDeleted } from '../utils/responses'
import { Channel, Connector, GetStartedButton } from '../models'
import { getChannelIntegrationByIdentifier } from '../channel_integrations'
import { NotFoundError, renderError } from '../utils'
import { ConflictError } from '../utils/errors'

export default class GetStartedButtonController {
  /**
   * Create a new GetStartedButton
   */
  static async create (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const channel_id = req.params.channel_id
    const channel = await Channel.findOne({
      connector: connector._id,
      _id: channel_id,
    })
    if (!channel) {
      throw new NotFoundError('Channel')
    }

    const getStarted = await GetStartedButton.findOne({
      channel_id: channel._id,
    })
    if (getStarted) {
      throw new ConflictError('A GetStartedButton already exists')
    }
    const getStartedButtonValue = req.body.value

    const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
    try {
      await channelIntegration.setGetStartedButton(channel, getStartedButtonValue, connector)
    } catch (err) {
      return renderError(res, err)
    }
    const getStartedButton = await new GetStartedButton({
      channel_id: channel._id,
      value: getStartedButtonValue,
    })
    await getStartedButton.save()
    channel.hasGetStarted = true
    await channel.save()

    return renderCreated(res, {
      results: getStartedButton.serialize,
      message: 'GetStartedButton successfully created',
    })
  }

  /**
   * Show a GetStartedButton
   */
  static async show (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const channel_id = req.params.channel_id
    const channel = await Channel.findOne({
      connector: connector._id,
      _id: channel_id,
    })
    if (!channel) {
      throw new NotFoundError('Channel')
    }

    const getStartedButton = await GetStartedButton.findOne({ channel_id: channel._id })
    if (!getStartedButton) {
      throw new NotFoundError('GetStartedButton')
    }

    return renderOk(res, {
      results: getStartedButton.serialize,
      message: 'getStartedButton successfully rendered',
    })
  }

  /**
   * Update a GetStartedButton
   */
  static async update (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    if (!connector) {
      throw new NotFoundError('Connector')
    }
    const channel_id = req.params.channel_id
    const channel = await Channel.findOne({
      connector: connector._id,
      _id: channel_id,
    })
    if (!channel) {
      throw new NotFoundError('Channel')
    }

    const getStartedButton = await GetStartedButton.findOne({ channel_id: channel._id })
    if (!getStartedButton) {
      throw new NotFoundError('GetStartedButton')
    }
    const newValue = req.body.value
    const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
    try {
      await channelIntegration.setGetStartedButton(channel, newValue)
    } catch (err) {
      return renderError(res, err)
    }
    getStartedButton.value = newValue
    await getStartedButton.save()

    return renderOk(res, {
      results: getStartedButton.serialize,
      message: 'GetStartedButton successfully updated',
    })
  }

  /**
   * Delete a GetStartedButton
   */
  static async delete (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    if (!connector) {
      throw new NotFoundError('Connector')
    }
    const channel_id = req.params.channel_id
    const channel = await Channel.findOne({
      connector: connector._id,
      _id: channel_id,
    })
    if (!channel) {
      throw new NotFoundError('Channel')
    }

    const getStartedButton = await GetStartedButton.findOne({ channel_id: channel._id })
    if (!getStartedButton) {
      throw new NotFoundError('GetStartedButton')
    }

    const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
    try {
      await channelIntegration.deleteGetStartedButton(channel)
    } catch (err) {
      return renderError(res, err)
    }
    await getStartedButton.remove()
    channel.hasGetStarted = false
    await channel.save()

    return renderDeleted(res, 'GetStartedButton successfully deleted')
  }
}
