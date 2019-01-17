import filter from 'filter-object'

import { BadRequestError, NotFoundError } from '../utils/errors'
import { renderOk, renderCreated, renderDeleted } from '../utils/responses'
import { Connector, Channel, Conversation } from '../models'

const permittedAdd = '{url,isTyping,defaultDelay}'
const permittedUpdate = '{url,isTyping,defaultDelay}'

export default class Connectors {

  /**
   * Create a new connector
   */
  static async create (req, res) {
    const payload = filter(req.body, permittedAdd)

    const connector = await new Connector(payload).save()
    const result = connector.serialize
    result.conversations = []
    result.channels = []

    return renderCreated(res, {
      results: result,
      message: 'Connector successfully created',
    })
  }

  /**
  * Show a connector
  */
  static async show (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const result = connector.serialize
    result.channels = await Channel.find({ connector: connector._id, isActive: true })
    result.channels = result.channels.map(c => c.serialize || c)
    if (req.query.light !== 'true') {
      result.conversations = await Conversation.find(
        { connector: connector._id },
        { _id: 1 })
      result.conversations = result.conversations.map(c => c._id)
    }

    return renderOk(res, {
      results: result,
      message: 'Connector successfully found',
    })
  }

  /*
  * Update a connector
  */
  static async update (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const delay = req.body.defaultDelay
    // isNaN(null) is a Number
    if (delay !== undefined && (isNaN(delay) || delay < 0 || delay > 5)) {
      throw new BadRequestError('defaultDelay parameter is invalid')
    }

    const updatedConnector = await Connector
      .findOneAndUpdate({ _id: connector._id },
        { $set: filter(req.body, permittedUpdate) }, { new: true }
      )

    const result = updatedConnector.serialize
    result.channels = await Channel.find({ connector: connector._id, isActive: true })
    result.channels = result.channels.map(c => c.serialize || c)
    result.conversations = await Conversation.find(
      { connector: connector._id },
      { _id: 1 })
    result.conversations = result.conversations.map(c => c._id)

    return renderOk(res, {
      results: result,
      message: 'Connector successfully updated',
    })
  }

  /**
  * Delete a connector
  */
  static async delete (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    await recursiveDestroy(connector)
    await Connector.updateOne({ _id: connector._id }, { $set: { isActive: false } })

    return renderDeleted(res, 'Connector successfully deleted')
  }

}

/*
 * Helpers
 */

/**
 * Recursively delete all the channels and the conversations associated to a connector
 */
const recursiveDestroy = async (connector) => {
  await Channel.update({ connector: connector._id },
    { $set: { isActive: false } },
    { multi: true })
  await Conversation.update({ connector: connector._id },
    { $set: { isActive: false } },
    { multi: true })
}
