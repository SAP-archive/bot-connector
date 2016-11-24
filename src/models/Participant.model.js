import mongoose from 'mongoose'

const ParticipantSchema = new mongoose.Schema({
  senderId: String,
  isBot: { type: Boolean, default: false },
}, {
  timestamps: true,
})

ParticipantSchema.virtual('serialize').get(function () {
  return {
    id: this._id,
    isBot: this.isBot,
    senderId: this.senderId,
  }
})

const Participant = mongoose.model('Participant', ParticipantSchema)

module.exports = Participant
