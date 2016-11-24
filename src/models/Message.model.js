import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema({
  attachment: { type: Object },
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant', required: true },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
}, {
  timestamps: true,
})

MessageSchema.virtual('serialize').get(function () {
  return {
    id: this._id,
    attachment: this.attachment,
    participant: this.participant,
    conversation: this.conversation,
  }
})

const Message = mongoose.model('Message', MessageSchema)

module.exports = Message
