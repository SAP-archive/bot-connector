import crypto from 'crypto'
import Conversation from '../../src/models/conversation'

const build = async (connector, channel, opts = {}) => {
  const conversation = new Conversation({
    channel,
    connector,
    chatId: opts.chatId || crypto.randomBytes(20).toString('hex'),
  })

  return conversation.save()
}

module.exports = { build }
