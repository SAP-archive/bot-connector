import mongoose from 'mongoose'

const ConversationSchema = new mongoose.Schema({
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  bot: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', required: true },
  chatId: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }],
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
}, {
  usePushEach: true,
  timestamps: true,
})

ConversationSchema.virtual('serialize').get(function () {
  return {
    id: this._id,
    channel: this.channel,
    bot: this.bot,
    chatId: this.chatId,
    isActive: this.isActive,
  }
})

ConversationSchema.virtual('full').get(function () {
  return {
    id: this._id,
    bot: this.bot,
    chatId: this.chatId,
    channel: this.channel,
    participants: this.participants,
    messages: this.messages,
    isActive: this.isActive,
  }
})

const Conversation = mongoose.model('Conversation', ConversationSchema)

module.exports = Conversation
