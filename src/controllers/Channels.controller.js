import filter from 'filter-object'

import {
  notFoundError,
  handleMongooseError,
} from '../utils/errors'
import { invoke } from '../utils'

const permitted = '{type,slug,isActivated,token,userName,apiKey,webhook}'

export default class ChannelsController {

  /**
  * Create a new channel
  */
  static async createChannelByBotId (req, res) {
    let bot, channel
    const { bot_id } = req.params
    const { slug } = req.body
    const params = filter(req.body, permitted)

    try {
      bot = await Bot.findById(req.params.bot_id).populate('channels').exec()
      if (!bot) { throw new notFoundError('Bot') }

      channel = await Channel.findOne({ bot: bot_id, slug })
      if (channel) {
        return res.status(409).json({ results: null, message: 'Channel slug already exists' })
      }
      channel = await new Channel({ ...params, bot: bot._id }).save()

      bot.channels.push(channel._id)
      await bot.save()
      await invoke(channel.type, 'onChannelCreate', [channel])

      res.status(201).json({ results: channel.serialize, message: 'Channel successfully created' })
    } catch (err) {
      /* coverage ignore if */
      if (bot && channel) {
        bot.channels = bot.channels.filter(c => c !== channel._id)
        await Promise.all([bot.save(), channel.remove()])
      }
      return handleMongooseError(err, res, 'Error while creating channel')
    }
  }

  /**
  * Index bot's channels
  */
  static getChannelsByBotId (req, res) {
    Channel.find({ bot: req.params.bot_id })
    .then(channels => {
      if (!channels.length) { return res.json({ results: [], message: 'No channels' }) }
      res.json({ results: channels.map(c => c.serialize), message: 'Channels successfully rendered' })
    })
    .catch(/* coverage ignore next */ err => handleMongooseError(err, res, 'Error while getting channel'))
  }

  /**
  * Show a channel
  */
  static getChannelByBotId (req, res) {
    Channel.findOne({ slug: req.params.channel_slug, bot: req.params.bot_id })
    .then(channel => {
      if (!channel) { return Promise.reject(new notFoundError('Channel')) }
      res.json({ results: channel.serialize, message: 'Channel successfully rendered' })
    })
    .catch(err => handleMongooseError(err, res, 'Error while getting channel'))
  }

  /**
  * Update a channel
  */
  static async updateChannelByBotId (req, res) {
    try {
      const { bot_id, channel_slug } = req.params
      const { slug } = req.body

      if (slug && await (Channel.findOne({ bot: bot_id, slug }))) {
        return res.status(409).json({ results: null, message: 'Channel slug already exists' })
      }

      const channel = await Channel.findOneAndUpdate({ slug: channel_slug, bot: bot_id }, { $set: filter(req.body, permitted) }, { new: true })
      if (!channel) { throw new notFoundError('Channel') }

      await invoke(channel.type, 'onChannelUpdate', [channel])

      res.json({ results: channel.serialize, message: 'Channel successfully updated' })
    } catch (err) {
      handleMongooseError(err, res, 'Error while updating channel')
    }
  }

  /**
  * Delete a channel
  */
  static async deleteChannelByBotId (req, res) {
    const { channel_slug, bot_id } = req.params

    try {
      const channel = await Channel.findOne({ slug: channel_slug, bot: bot_id })
      .populate({ path: 'bot', populate: { path: 'channels', model: 'Channel' } })
      .exec()
      if (!channel) { throw new notFoundError('Channel') }

      const { bot } = channel
      bot.channels = bot.channels.filter(c => c._id.toString() !== channel._id.toString())

      await invoke(channel.type, 'onChannelDelete', [channel])
      await Promise.all([bot.save(), channel.remove()])

      res.json({ results: null, message: 'Channel successfully deleted' })
    } catch (err) {
      handleMongooseError(err, res, 'Error while deleting channel')
    }
  }
}
