import _ from 'lodash'
import uuidV4 from 'uuid/v4'
import mongoose from 'mongoose'

import { getWebhookToken } from '../utils'
import slug from 'slug'

export const slugify = str => slug(str, { lower: true, replacement: '-' })

const ChannelSchema = new mongoose.Schema({
  _id: { type: String, default: uuidV4 },
  connector: { type: String, ref: 'Connector', required: true },
  slug: { type: String, required: true },
  type: { type: String, required: true },
  isErrored: { type: Boolean, required: true, default: false },
  isActive: { type: Boolean, required: true, default: true },
  isActivated: { type: Boolean, required: true, default: true },
  forwardConversationStart: { type: Boolean, default: false },
  hasGetStarted: { type: Boolean, default: false },

  token: String,
  clientAppId: String,
  clientId: String,
  clientSecret: String,
  consumerKey: String,
  consumerSecret: String,
  accessToken: String,
  accessTokenSecret: String,
  envName: String,
  bearerToken: String,
  botuser: String,
  userName: String,
  password: String,
  serviceId: String,
  phoneNumber: String,
  apiKey: String,
  webhook: String,
  oAuthUrl: String,
  webhookToken: String,
  refreshToken: String,
  app: { type: String, ref: 'Channel' },
  children: [{ type: String, ref: 'Channel' }],

  /*
   * Fields used for the Webchat channel configuration
   */
  accentColor: String,
  webchatLocale: { type: String },
  complementaryColor: String,
  botMessageColor: String,
  botMessageBackgroundColor: String,
  backgroundColor: String,
  headerLogo: String,
  headerTitle: String,
  botPicture: String,
  userPicture: String,
  onboardingMessage: String,
  expanderLogo: String,
  expanderTitle: String,
  conversationTimeToLive: Number,
  welcomeMessage: String,
  openingType: { type: String, enum: ['memory', 'never', 'always'], default: 'never' },
  characterLimit: Number,
  // if channel type is webchat and there's nothing (NOT if value is empty!), set to empty string
  userInputPlaceholder: String,
  socketId: String,

  /*
   * Fields used for Amazon Alexa integration
   */
  oAuthCode: String,
  oAuthTokens: Object,
  invocationName: String,
  vendor: String,
  skillId: String,
  locales: [String],
}, {
  timestamps: true,
  usePushEach: true,
})

async function generateUUID (next) {
  if (this.isNew) {
    while (await ChannelModel.findOne({ _id: this._id })) {
      this._doc._id = uuidV4()
    }
  }
  next()
}

function slugifyName (next) {
  this._doc.slug = slugify(this._doc.slug)
  next()
}

const DEFAULT_INPUT_PLACEHOLDER = 'Write a reply'

function addUserInputPlaceholder (next) {
  const isWebchat = ['webchat', 'recastwebchat'].includes(this.type)
  if (isWebchat && (typeof this.userInputPlaceholder === 'undefined')) {
    this.userInputPlaceholder = DEFAULT_INPUT_PLACEHOLDER
  }
  next()
}

ChannelSchema.pre('save', generateUUID)
ChannelSchema.pre('save', slugifyName)
ChannelSchema.pre('save', addUserInputPlaceholder)

ChannelSchema.virtual('serialize').get(function () {
  const filteredChannel = _.pickBy(this.toObject(), (value, key) => {
    return value !== undefined && !['_id', '__v', 'isActive'].includes(key)
  })

  // Cannot serialize children as they're not Mongoose object anymore
  // due to this.toObject
  if (filteredChannel.type === 'slackapp') {
    filteredChannel.children = filteredChannel.children.map(c => {
      return typeof c === 'string'
        ? c
        : {
          createdAt: c.createdAt,
          slug: c.slug,
          botuser: c.botuser,
          token: c.token,
        }
    })
  } else {
    delete filteredChannel.children
  }

  return {
    id: this._id,
    ...filteredChannel,
    isErrored: this.isErrored,
    isActivated: this.isActivated,
    webhookToken: this.type === 'messenger'
      ? getWebhookToken(this._id, this.slug) : this.webhookToken,
    hasGetStarted: this.hasGetStarted,
  }
})

ChannelSchema.index({ connector: 1 })
const ChannelModel = mongoose.model('Channel', ChannelSchema)
export default ChannelModel
