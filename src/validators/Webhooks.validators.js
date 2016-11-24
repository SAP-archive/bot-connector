import mongoose from 'mongoose'

import { ValidationError, handleMongooseError } from '../utils/errors'

export const forwardMessage = (req, res, next) => {
  const { channel_id } = req.params

  if (!mongoose.Types.ObjectId.isValid(channel_id)) {
    return handleMongooseError(new ValidationError('channel_id', 'invalid'), res)
  }

  return next()
}

export const subscribeFacebookValidator = (req, res, next) => {
  const { channel_id } = req.params

  if (!mongoose.Types.ObjectId.isValid(channel_id)) {
    return handleMongooseError(new ValidationError('channel_id', 'invalid'), res)
  }

  return next()
}
