import Participant from '../../src/models/participant'

function build (conversation, opts = {}) {
  const participant = new Participant({
    conversation: conversation._id,
    senderId: opts.senderId || 'senderId',
    data: opts.data || { name: 'someParticipant' },
    isBot: opts.isBot || false,
    type: opts.type || 'user',
  })

  return participant.save()
}

export default {
  build,
}
