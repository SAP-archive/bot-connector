import mongoose from 'mongoose'
import uuidV4 from 'uuidV4'

const BotSchema = new mongoose.Schema({
  _id: { type: String, default: uuidV4 },
  url: { type: String, required: true },
  channels: [{ type: String, ref: 'Channel' }],
  conversations: [{ type: String, ref: 'Conversation' }],
}, {
  usePushEach: true,
  timestamps: true,
})

async function generateUUID (next) {
  if (this.isNew) {
    while (await models.Bot.findOne({ _id: this._id })) {
      this._id = uuidV4()
    }
  }
  next()
}

BotSchema.pre('save', generateUUID)

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
