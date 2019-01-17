import { renderOk, renderCreated, renderDeleted } from '../utils/responses'
import { Channel, Connector, PersistentMenu } from '../models'
import { getChannelIntegrationByIdentifier } from '../channel_integrations'
import { NotFoundError } from '../utils'
import { ConflictError } from '../utils/errors'

export default class PersistentMenuController {
  /**
   * Create a new Persistent menu for a given language
   */
  static async create (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    if (!connector) {
      throw new NotFoundError('Connector')
    }
    if (await PersistentMenu.findOne({
      connector_id: connector._id,
      locale: req.body.language,
    })) {
      throw new ConflictError('A persistent menu already exists for this language')
    }
    // Retrieving all the channels to be updated with the new menu
    const channels = await Channel.find({ connector: connector._id, isActive: true })

    const newMenu = await new PersistentMenu({
      connector_id: connector._id,
      menu: req.body.menu,
      locale: req.body.language,
    })
    // Retrieving existing menus for other languages
    const existingMenus = await PersistentMenu.find({ connector_id: connector._id })
    if (!existingMenus.length) {
      newMenu.default = true
    }
    existingMenus.push(newMenu)
    await Promise.all(channels.map(async (channel) => {
      try {
        const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
        await channelIntegration.setPersistentMenu(channel, existingMenus)
      } catch (err) {} //eslint-disable-line
    }))

    await newMenu.save()

    return renderCreated(res, {
      results: newMenu.serialize,
      message: 'PersistentMenu successfully created',
    })
  }

  /**
   * Index persistent menus for all languages
   */
  static async index (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    if (!connector) {
      throw new NotFoundError('Connector')
    }
    const existingMenus = await PersistentMenu.find({ connector_id: connector._id })

    return renderOk(res, {
      results: existingMenus.map(m => m.serialize),
      message: existingMenus.length
        ? 'Persistent menus successfully rendered' : 'No Persistent menu',
    })
  }

  /**
   * Show a persistent menu for a language
   */
  static async show (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    if (!connector) {
      throw new NotFoundError('Connector')
    }
    const menu = await PersistentMenu.findOne({
      connector_id: connector.id,
      locale: req.params.language,
    })
    if (!menu) {
      throw new NotFoundError('PersistentMenu')
    }

    return renderOk(res, {
      results: menu.serialize,
      message: 'PersistentMenu successfully rendered',
    })
  }

  /**
   * set the given language menu to default
   */
  static async setDefault (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    if (!connector) {
      throw new NotFoundError('Connector')
    }
    const language = req.body.language
    // throw error if language menu does not exist
    if (!await PersistentMenu.findOneAndUpdate(
      { connector_id: connector._id, locale: language },
      { $set: { default: true } })) {
      throw new NotFoundError('PersistentMenu')
    }
    // unset previous default menu
    await PersistentMenu.findOneAndUpdate(
      { connector_id: connector._id, default: true, locale: { $ne: language } },
      { $set: { default: false } })
    const existingMenus = await PersistentMenu.find({ connector_id: connector._id })

    const channels = await Channel.find({ connector: connector._id, isActive: true })

    await Promise.all(channels.map(async (channel) => {
      try {
        const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
        await channelIntegration.setPersistentMenu(channel, existingMenus)
      } catch (err) {} //eslint-disable-line
    }))

    return renderOk(res, {
      message: 'Default menu successfully updated',
    })
  }

  /**
   * Update a menu for a given language
   */
  static async update (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const language = req.params.language
    const persistentMenu = await PersistentMenu.findOne({
      connector_id: connector._id,
      locale: language,
    })
    if (!persistentMenu) {
      throw new NotFoundError('PersistentMenu')
    }
    persistentMenu.menu = req.body.menu
    const existingMenus = await PersistentMenu.find({
      connector_id: connector._id,
      locale: { $ne: language },
    })
    existingMenus.push(persistentMenu)
    const channels = await Channel.find({ connector: connector._id, isActive: true })
    await Promise.all(channels.map(async (channel) => {
      try {
        const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
        await channelIntegration.setPersistentMenu(channel, existingMenus)
      } catch (e) {} //eslint-disable-line
    }))

    persistentMenu.markModified('menu')
    await persistentMenu.save()

    return renderOk(res, {
      results: persistentMenu.serialize,
      message: 'PersistentMenu successfully updated',
    })
  }

  /**
   * Delete a persistent menu for a given language
   * If it's the only menu for the  connector, delete the property
   * Else, update the property to all channels
   */
  static async delete (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    if (!connector) {
      throw new NotFoundError('Connector')
    }
    const language = req.params.language
    const menu = await PersistentMenu.findOne({
      connector_id: connector._id,
      locale: language,
    })
    if (!menu) {
      throw new NotFoundError('PersistentMenu')
    } else if (menu.default === true) {
      // if deleted menu is default, set another menu to default
      await PersistentMenu.findOneAndUpdate(
        { connector_id: connector._id, default: false },
        { $set: { default: true } })
    }
    const existingMenus = await PersistentMenu.find({
      connector_id: connector._id,
      locale: { $ne: language },
    })

    const channels = await Channel.find({ connector: connector._id, isActive: true })
    await Promise.all(channels.map(async (channel) => {
      try {
        const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
        if (!existingMenus.length) {
          await channelIntegration.deletePersistentMenu(channel)
        } else {
          await channelIntegration.setPersistentMenu(channel, existingMenus)
        }
      } catch (e) {} //eslint-disable-line
    }))

    await menu.remove()

    return renderDeleted(res, 'Persistent Menu successfully deleted')
  }

  static async deleteAll (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    if (!connector) {
      throw new NotFoundError('Connector')
    }
    await PersistentMenu.deleteMany({ connector_id: connector._id })
    const channels = await Channel.find({ connector: connector._id, isActive: true })
    await Promise.all(channels.map(async (channel) => {
      try {
        const channelIntegration = getChannelIntegrationByIdentifier(channel.type)
        await channelIntegration.deletePersistentMenu(channel)
      } catch (e) {} //eslint-disable-line
    }))

    return renderDeleted(res, 'Persistent Menu successfully deleted')
  }
}
