import mongoose from 'mongoose'
import uuidV4 from 'uuid/v4'

const ConversationSchema = new mongoose.Schema({
  _id: { type: String, default: uuidV4 },
  channel: { type: String, ref: 'Channel', required: true },
  connector: { type: String, ref: 'Connector', required: true },
  chatId: { type: String, required: true },
  participants: [{ type: String, ref: 'Participant' }],
  messages: [{ type: String, ref: 'Message' }],
}, {
  usePushEach: true,
  timestamps: true,
})

async function generateUUID (next) {
  if (this.isNew) {
    while (await models.Conversation.findOne({ _id: this._id })) {
      this._id = uuidV4()
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
    participants: this.participants.map(p => p.serialize),
    messages: this.messages.map(m => m.serialize),
  }
})

const Conversation = mongoose.model('Conversation', ConversationSchema)

module.exports = Conversation
