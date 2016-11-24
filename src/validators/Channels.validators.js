import mongoose from 'mongoose'
import filter from 'filter-object'

import { invoke } from '../utils'
import { handleMongooseError, ValidationError } from '../utils/errors'

const permitted = '{type,slug,isActivated,token,userName,apiKey,webhook}'

export async function createChannelByBotId (req, res, next) {
  const { isActivated, slug, type } = req.body
  const { bot_id } = req.params
  const newChannel = new Channel(filter(req.body, permitted))

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return handleMongooseError(new ValidationError('bot_id', 'invalid'), res)
  } else if (!type) {
    return handleMongooseError(new ValidationError('type', 'missing'), res)
  } else if (!isActivated) {
    return handleMongooseError(new ValidationError('isActivated', 'missing'), res)
  } else if (!slug) {
    return handleMongooseError(new ValidationError('slug', 'missing'), res)
  } else if (!services[type]) {
    return handleMongooseError(new ValidationError('type', 'invalid'), res)
  }

  try {
    await invoke(newChannel.type, 'checkParamsValidity', [newChannel])
  } catch (err) {
    return handleMongooseError(err, res, 'Error while creating channel')
  }

  return next()
}

export const getChannelsByBotId = (req, res, next) => {
  const { bot_id } = req.params

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return handleMongooseError(new ValidationError('bot_id', 'invalid'), res)
  }

  return next()
}

export const getChannelByBotId = (req, res, next) => {
  const { bot_id } = req.params

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return handleMongooseError(new ValidationError('bot_id', 'invalid'), res)
  }

  return next()
}

export const updateChannelByBotId = (req, res, next) => {
  const { bot_id } = req.params

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return handleMongooseError(new ValidationError('bot_id', 'invalid'), res)
  }

  return next()
}

export const deleteChannelByBotId = (req, res, next) => {
  const { bot_id } = req.params

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return handleMongooseError(new ValidationError('bot_id', 'invalid'), res)
  }

  return next()
}
