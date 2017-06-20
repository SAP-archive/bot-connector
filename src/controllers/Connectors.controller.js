import _ from 'lodash'
import filter from 'filter-object'

import { NotFoundError, BadRequestError } from '../utils/errors'
import { renderOk, renderCreated, renderDeleted } from '../utils/responses'

const permittedAdd = '{url,isTyping}'
const permittedUpdate = '{url,isTyping}'

export default class ConnectorsController {

  /**
   * Create a new connector
   */
  static async create (req, res) {
    const payload = filter(req.body, permittedAdd)

    const connector = await new models.Connector(payload).save()

    return renderCreated(res, {
      results: connector.serialize,
      message: 'Connector successfully created',
    })
  }

  /**
  * Show a connector
  */
  static async show (req, res) {
    const { connector_id } = req.params

    const connector = await models.Connector.findById(connector_id)

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    return renderOk(res, {
      results: connector.serialize,
      message: 'Connector successfully found',
    })
  }

  /*
  * Update a connector
  */
  static async update (req, res) {
    const { connector_id } = req.params

    const connector = await global.models.Connector.findOneAndUpdate(
      { _id: connector_id },
      { $set: filter(req.body, permittedUpdate) }, { new: true }
    ).populate('channels')

    return renderOk(res, {
      results: connector.serialize,
      message: 'Connector successfully updated',
    })
  }

  /**
  * Delete a connector
  */
  static async delete (req, res) {
    const { connector_id } = req.params

    const connector = await models.Connector.findById(connector_id)
      .populate('channels conversations')

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    await Promise.all([
      ...connector.conversations.map(c => c.remove()),
      ...connector.channels.map(c => c.remove()),
      connector.remove(),
    ])

    return renderDeleted(res, 'Connector successfully deleted')
  }

}
