import mongoose from 'mongoose'
import uuidV4 from 'uuid/v4'

const ParticipantSchema = new mongoose.Schema({
  _id: { type: String, default: uuidV4 },
  senderId: String,
  isBot: { type: Boolean, default: false },
}, {
  timestamps: true,
})

async function generateUUID (next) {
  if (this.isNew) {
    while (await models.Participant.findOne({ _id: this._id })) {
      this._id = uuidV4()
    }
  }
  next()
}

ParticipantSchema.pre('save', generateUUID)

ParticipantSchema.virtual('serialize').get(function () {
  return {
    id: this._id,
    isBot: this.isBot,
    senderId: this.senderId,
  }
})

const Participant = mongoose.model('Participant', ParticipantSchema)

module.exports = Participant
