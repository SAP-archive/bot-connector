import mongoose from 'mongoose'
import { getWebhookToken } from '../utils'

const ChannelSchema = new mongoose.Schema({
  bot: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', required: true },
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

ChannelSchema.virtual('serialize').get(function () {
  return {
    id: this._id,
    bot: this.bot,
    slug: this.slug,
    type: this.type,
    token: this.token,
    userName: this.userName,
    apiKey: this.apiKey,
    webhook: this.webhook,
    isActivated: this.isActivated,
    webhookToken: this.verifyToken = this.type === 'messenger' ? getWebhookToken(this._id, this.slug) : null,
  }
})

const Channel = mongoose.model('Channel', ChannelSchema)

module.exports = Channel
