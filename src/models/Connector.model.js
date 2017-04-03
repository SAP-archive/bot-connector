import mongoose from 'mongoose'
import uuidV4 from 'uuid/v4'

const ConnectorSchema = new mongoose.Schema({
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
    while (await models.Connector.findOne({ _id: this._id })) {
      this._id = uuidV4()
    }
  }
  next()
}

ConnectorSchema
  .pre('save', generateUUID)

ConnectorSchema.virtual('serialize').get(function () {
  return {
    id: this._id,
    url: this.url,
    conversations: this.conversations,
    channels: this.channels.map(c => c.serialize || c),
  }
})

ConnectorSchema.virtual('lightSerialize').get(function () {
  return {
    id: this._id,
    url: this.url,
  }
})

const Connector = mongoose.model('Connector', ConnectorSchema)

module.exports = Connector
