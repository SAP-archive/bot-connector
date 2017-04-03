import mongoose from 'mongoose'
import uuidV4 from 'uuid/v4'
import _ from 'lodash'

import { getWebhookToken } from '../utils'

const ChannelSchema = new mongoose.Schema({
  _id: { type: String, default: uuidV4 },
  connector: { type: String, ref: 'Connector', required: true },
  slug: { type: String, required: true },
  type: { type: String, required: true },
  isErrored: { type: Boolean, required: true, default: false },
  isActivated: { type: Boolean, required: true, default: true },

  token: String,
  clientId: String,
  clientSecret: String,
  botuser: String,
  userName: String,
  password: String,
  serviceId: String,
  phoneNumber: String,
  apiKey: String,
  webhook: String,
  oAuthUrl: String,
  webhookToken: String,
  app: { type: String, ref: 'Channel' },
  children: [{ type: String, ref: 'Channel' }],
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
  // Filter the content of the Channel to keep only the initialized field
  const filteredChannel = _.pickBy(this.toObject(), (value) => value)
  delete filteredChannel._id

  return {
    id: this._id,
    ...filteredChannel,
    isActivated: this.isActivated,
    isErrored: this.isErrored,
    webhookToken: this.type === 'messenger' ? getWebhookToken(this._id, this.slug) : this.webhookToken,
  }
})

const Channel = mongoose.model('Channel', ChannelSchema)

module.exports = Channel
