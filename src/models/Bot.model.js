import mongoose from 'mongoose'

const BotSchema = new mongoose.Schema({
  url: { type: String, required: true },
  channels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }],
  conversations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }],
}, {
  usePushEach: true,
  timestamps: true,
})

BotSchema.virtual('serialize').get(function () {
  return {
    id: this._id,
    url: this.url,
    channels: this.channels,
    conversations: this.conversations,
  }
})

BotSchema.virtual('lightSerialize').get(function () {
  return {
    id: this._id,
    url: this.url,
  }
})

const Bot = mongoose.model('Bot', BotSchema)

module.exports = Bot
