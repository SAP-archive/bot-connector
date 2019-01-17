import uuidV4 from 'uuid/v4'
import mongoose from 'mongoose'

const GetStartedButtonSchema = new mongoose.Schema({
  _id: { type: String, default: uuidV4 },
  channel_id: { type: String, required: true, unique: true },
  value: String,
}, {
  timestamps: true,
})

GetStartedButtonSchema.index({ channel_id: 1 })

GetStartedButtonSchema.virtual('serialize').get(function () {
  return {
    value: this.value,
  }
})

const GetStartedButtonModel = mongoose.model('GetStartedButton', GetStartedButtonSchema)
export default GetStartedButtonModel
