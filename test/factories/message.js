import Message from '../../src/models/message'

function build (conversation, participant, opts = {}) {
  const message = new Message({
    attachement: opts.attachment || { type: 'text', content: 'this is a text message' },
    conversation: conversation._id,
    participant: participant._id,
  })

  return message.save()
}

export default {
  build,
}
