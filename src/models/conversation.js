import uuidV4 from 'uuid/v4'
import mongoose from 'mongoose'

const ConversationSchema = new mongoose.Schema({
  _id: { type: String, default: uuidV4 },
  channel: { type: String, ref: 'Channel', required: true },
  connector: { type: String, ref: 'Connector', required: true },
  chatId: { type: String, required: true },
  isActive: { type: Boolean, required: true, default: true },

  microsoftAddress: Object,
  socketId: String,
  replyToken: String,
}, {
  usePushEach: true,
  timestamps: true,
})

async function generateUUID (next) {
  if (this.isNew) {
    while (await ConversationModel.findOne({ _id: this._id })) {
      this._doc._id = uuidV4()
    }
  }
  next()
}

ConversationSchema.pre('save', generateUUID)

ConversationSchema.virtual('serialize').get(function () {
  return {
    id: this._id,
    channel: this.channel,
    connector: this.connector,
    chatId: this.chatId,
  }
})

ConversationSchema.virtual('full').get(function () {
  return {
    id: this._id,
    connector: this.connector,
    chatId: this.chatId,
    channel: this.channel,
  }
})

ConversationSchema.index({ channel: 1 })
ConversationSchema.index({ connector: 1 })
ConversationSchema.index({ chatId: 1 })
const ConversationModel = mongoose.model('Conversation', ConversationSchema)
export default ConversationModel
