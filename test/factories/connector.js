import crypto from 'crypto'
import Connector from '../../src/models/connector'

const build = async (opts = {}) => {
  const connector = new Connector({
    url: opts.url || `https://${crypto.randomBytes(20).toString('hex')}.fr`,
    isActive: opts.isActive || true,
  })

  return connector.save()
}

module.exports = { build }
