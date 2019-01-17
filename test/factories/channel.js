import crypto from 'crypto'
import Channel from '../../src/models/channel'

const build = async (connector, opts = {}) => {
  const data = {
    connector: connector._id,
    slug: opts.slug || crypto.randomBytes(20).toString('hex'),
    type: opts.type || 'recastwebchat',
    isActivated: opts.isActivated === false ? opts.isActivated : true,
    token: crypto.randomBytes(20).toString('hex'),
  }
  Object.keys(opts).forEach(k => {
    if (data[k] === undefined) {
      data[k] = opts[k]
    }
  })
  const channel = new Channel(data)

  return channel.save()
}

module.exports = { build }
