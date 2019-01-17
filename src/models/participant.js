import mongoose from 'mongoose'
import uuidV4 from 'uuid/v4'

const ParticipantSchema = new mongoose.Schema({
  _id: { type: String, default: uuidV4 },
  conversation: { type: String, required: true },
  senderId: String,
  data: { type: Object },
  isBot: { type: Boolean, default: false },
  type: String, // One of 'user', 'bot' or 'agent'
}, {
  timestamps: true,
})

ParticipantSchema.pre('save', generateUUID)

ParticipantSchema.virtual('serialize').get(function () {
  return {
    id: this._id,
    isBot: this.isBot,
    senderId: this.senderId,
  }
})

ParticipantSchema.virtual('adminSerialize').get(function () {
  return {
    id: this._id,
    data: this.data,
    isBot: this.isBot,
    senderId: this.senderId,
    type: this.type,
  }
})

ParticipantSchema.index({ conversation: 1 })
const Participant = mongoose.model('Participant', ParticipantSchema)

async function generateUUID (next) {
  if (this.isNew) {
    while (await Participant.findOne({ _id: this._id })) {
      this._doc._id = uuidV4()
    }
  }
  next()
}

export default Participant
