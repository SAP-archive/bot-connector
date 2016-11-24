import mongoose from 'mongoose'

import { isInvalidUrl } from '../utils'
import { handleMongooseError, ValidationError } from '../utils/errors'

export const createBot = (req, res, next) => {
  const { url } = req.body

  if (isInvalidUrl(url)) {
    return handleMongooseError(new ValidationError('url', 'invalid'), res)
  }

  return next()
}

export const getBotById = (req, res, next) => {
  const { bot_id } = req.params

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return handleMongooseError(new ValidationError('bot_id', 'invalid'), res)
  }

  return next()
}

export const updateBotById = (req, res, next) => {
  const { bot_id } = req.params
  const { url } = req.body

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return handleMongooseError(new ValidationError('bot_id', 'invalid'), res)
  } else if (isInvalidUrl(url)) {
    return handleMongooseError(new ValidationError('url', 'invalid'), res)
  }

  return next()
}

export const deleteBotById = (req, res, next) => {
  const { bot_id } = req.params

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return handleMongooseError(new ValidationError('bot_id', 'invalid'), res)
  }

  return next()
}
