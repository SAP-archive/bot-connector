import mongoose from 'mongoose'

import { handleMongooseError, ValidationError } from '../utils/errors'

export const getParticipantsByBotId = (req, res, next) => {
  const { bot_id } = req.params

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return handleMongooseError(new ValidationError('bot_id', 'invalid'), res)
  }

  return next()
}

export const getParticipantByBotId = (req, res, next) => {
  const { bot_id, participant_id } = req.params

  if (!mongoose.Types.ObjectId.isValid(bot_id)) {
    return handleMongooseError(new ValidationError('bot_id', 'invalid'), res)
  } else if (!mongoose.Types.ObjectId.isValid(participant_id)) {
    return handleMongooseError(new ValidationError('participant_id', 'invalid'), res)
  }

  return next()
}
