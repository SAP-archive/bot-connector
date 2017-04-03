import mongoose from 'mongoose'
import uuidV4 from 'uuid/v4'

const MessageSchema = new mongoose.Schema({
  _id: { type: String, default: uuidV4 },
  attachment: { type: Object },
  participant: { type: String, ref: 'Participant', required: true },
  conversation: { type: String, ref: 'Conversation', required: true },
  receivedAt: { type: Date, default: Date.now() },
})

async function generateUUID (next) {
  if (this.isNew) {
    while (await models.Message.findOne({ _id: this._id })) {
      this._id = uuidV4()
    }
  }
  next()
}

MessageSchema.pre('save', generateUUID)

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
