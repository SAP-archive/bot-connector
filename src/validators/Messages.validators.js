import mongoose from 'mongoose'

import { handleMongooseError, ValidationError } from '../utils/errors'

export const postMessage = (req, res, next) => {
  const { bot_id, conversation_id } = req.params

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return handleMongooseError(new ValidationError('bot_id', 'invalid'), res)
  }

  if (!mongoose.Types.ObjectId.isValid(conversation_id)) {
    return handleMongooseError(new ValidationError('conversation_id', 'invalid'), res)
  }

  return next()
}
