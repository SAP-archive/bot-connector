import uuidV4 from 'uuid/v4'
import mongoose from 'mongoose'

const PersistentMenuSchema = new mongoose.Schema({
  _id: { type: String, default: uuidV4 },
  connector_id: { type: String, required: true },
  menu: { type: mongoose.Schema.Types.Mixed, required: true },
  default: { type: Boolean, default: false, required: true },
  locale: { type: String, required: true },
}, {
  timestamps: true,
})

PersistentMenuSchema.index({ connector_id: 1, locale: 1 }, { unique: true })
PersistentMenuSchema.index({ connector_id: 1 })

PersistentMenuSchema.virtual('serialize').get(function () {
  return {
    menu: this.menu,
    default: this.default,
    locale: this.locale,
  }
})

const PersistentMenuModel = mongoose.model('PersistentMenu', PersistentMenuSchema)
export default PersistentMenuModel
