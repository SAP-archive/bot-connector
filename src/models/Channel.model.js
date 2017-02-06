import mongoose from 'mongoose'
import uuid from 'uuid/v4'
import _ from 'lodash'

import { getWebhookToken } from '../utils'

const ChannelSchema = new mongoose.Schema({
  _id: { type: String, default: uuidV4 },
  bot: { type: String, ref: 'Bot', required: true },
  slug: { type: String, required: true },
  type: { type: String, required: true },
  token: String,
  userName: String,
  apiKey: String,
  webhook: String,
  webhookToken: String,
  isActivated: { type: Boolean, required: true },
}, {
  timestamps: true,
})

async function generateUUID (next) {
  if (this.isNew) {
    while (await models.Channel.findOne({ _id: this._id })) {
      this._id = uuidV4()
    }
  }
  next()
}

ChannelSchema.pre('save', generateUUID)

ChannelSchema.virtual('serialize').get(function () {
  const filteredChannel = _.pickBy(this.toObject(), (value) => value)
  delete filteredChannel._id

  return {
    id: this._id,
    ...filteredChannel,
    webhookToken: this.type === 'messenger' ? getWebhookToken(this._id, this.slug) : undefined,
  }
})

const Channel = mongoose.model('Channel', ChannelSchema)

module.exports = Channel
