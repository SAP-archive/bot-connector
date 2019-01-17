import uuidV4 from 'uuid/v4'
import mongoose from 'mongoose'

const ConnectorSchema = new mongoose.Schema({
  _id: { type: String, default: uuidV4 },
  url: { type: String, required: true },
  isActive: { type: Boolean, required: true, default: true },
  isTyping: { type: Boolean, required: true, default: true },
  defaultDelay: { type: Number, min: 0, max: 5 },
}, {
  usePushEach: true,
  timestamps: true,
})

ConnectorSchema
  .pre('save', generateUUID)

ConnectorSchema.virtual('serialize').get(function () {
  return {
    id: this._id,
    url: this.url,
    isTyping: this.isTyping,
    defaultDelay: this.defaultDelay,
  }
})

ConnectorSchema.virtual('lightSerialize').get(function () {
  return {
    id: this._id,
    url: this.url,
  }
})

const ConnectorModel = mongoose.model('Connector', ConnectorSchema)

async function generateUUID (next) {
  if (this.isNew) {
    while (await ConnectorModel.findOne({ _id: this._id })) {
      this._doc._id = uuidV4()
    }
  }
  next()
}

export default ConnectorModel
