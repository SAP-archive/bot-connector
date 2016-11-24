import filter from 'filter-object'

import { notFoundError, handleMongooseError } from '../utils/errors'

const permitted = '{url}'

export default class BotsController {

  /**
   * Create a new bot
   */
  static createBot (req, res) {
    new Bot(filter(req.body, permitted))
      .save()
      .then(savedBot => res.status(201).json({ results: savedBot.serialize, message: 'Bot successfully created' }))
      .catch(/* coverage ignore next */ err => handleMongooseError(err, res, 'Error while creating Bot'))
  }

  /**
  * Show a bot
  */
  static getBotById (req, res) {
    Bot.findById(req.params.bot_id)
      .populate('channels')
      .exec()
      .then(foundBot => {
        if (!foundBot) { return Promise.reject(new notFoundError('Bot')) }
        res.json({ results: foundBot.serialize, message: 'Bot successfully found' })
      })
      .catch(err => handleMongooseError(err, res, 'Error while getting Bot'))
  }

  /**
  * Index all bots
  */
  static getBots (req, res) {
    Bot.find({})
      .then(bots => {
        if (!bots || !bots.length) { return res.json({ results: [], message: 'No Bots' }) }
        res.json({
          results: bots.map(b => b.lightSerialize),
          message: 'Bots successfully found',
        })
      })
      .catch(/* coverage ignore next */ err => handleMongooseError(err, res, 'Error while getting Bots'))
  }

  /*
  * Update a bot
  */
  static updateBotById (req, res) {
    Bot.findByIdAndUpdate(req.params.bot_id, { $set: filter(req.body, permitted) }, { new: true })
      .then(updatedBot => {
        if (!updatedBot) { return Promise.reject(new notFoundError('Bot')) }
        res.json({ results: updatedBot.serialize, message: 'Bot successfully updated' })
      })
      .catch(err => handleMongooseError(err, res, 'Error while updating Bot'))
  }

  /**
  * Delete a bot
  */
  static deleteBotById (req, res) {
    Bot.remove({ _id: req.params.bot_id })
      .then(del => {
        if (!del.result.n) { return Promise.reject(new notFoundError('Bot')) }
        res.json({ results: null, message: 'Bot successfully deleted' })
      })
      .catch(err => handleMongooseError(err, res, 'Error while deleting Bot'))
  }
}
