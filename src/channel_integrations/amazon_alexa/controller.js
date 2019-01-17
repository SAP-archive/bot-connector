import { Channel, Connector } from '../../models'
import { logger } from '../../utils'
import { NotFoundError } from '../../utils/errors'
import AmazonAlexaChannel from './channel.js'

import { renderOk } from '../../utils/responses'

export default class AmazonController {

  static async loadChannel (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    const channel_slug = req.params.channel_slug

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    // Load the existing Channel model object
    let channel
    try {
      channel = await Channel.findOne({
        slug: channel_slug,
        connector: connector._id,
        isActive: true,
      })
    } catch (err) {
      logger.error(`[Amazon Alexa] Error loading Channel model: ${err}`)
      res.status(500).send(err)
    }

    if (!channel) {
      throw new NotFoundError('Channel')
    }
    return channel
  }

  static async getVendors (req, res) {
    const channel = await AmazonController.loadChannel(req, res)
    try {
      const channelIntegration = new AmazonAlexaChannel()
      const vendors = await channelIntegration.getVendors(channel)
      return renderOk(res, vendors.body)
    } catch (err) {
      logger.error(`[Amazon Alexa] Error retrieving Vendors: ${err} (${JSON.stringify(err.body)})`)
      logger.error(err.stack)
      res.status(500).send(err)
    }
  }

  static async deploy (req, res) {
    const channel = await AmazonController.loadChannel(req, res)
    try {
      const channelIntegration = new AmazonAlexaChannel()
      await channelIntegration.deploy(channel, req.body)
      return renderOk(res)
    } catch (err) {
      logger.error(`[Amazon Alexa] Error deploying: ${err} (${JSON.stringify(err.body)})`)
      logger.error(err.stack)
      res.status(500).send(err)
    }
  }

  static getSupportedLocales (req, res) {
    return renderOk(res, AmazonAlexaChannel.supportedLocales)
  }
}
