import AbstractChannelIntegration from '../abstract_channel_integration'
import { getWebhookToken, sendToWatchers } from '../../utils'
import { Participant } from '../../models'
export default class Webchat extends AbstractChannelIntegration {

  async beforeChannelCreated (channel) {
    channel.token = getWebhookToken(channel._id, channel.slug)
    return channel.save()
  }

  populateMessageContext (req) {
    const { chatId } = req.body

    return {
      chatId,
      senderId: `p-${chatId}`,
    }
  }

  formatOutgoingMessage (conversation, message) {
    return message
  }

  parseIncomingMessage (conversation, body) {
    const { attachment } = body.message

    if (attachment.type === 'button' || attachment.type === 'quickReply') {
      attachment.type = 'text'
      attachment.title = attachment.content.title
      attachment.content = attachment.content.value
    }

    return { attachment }
  }

  getMemoryOptions (body) {
    return body.memoryOptions || { memory: {}, merge: true }
  }

  async sendMessage (conversation, message) {
    message.participant = await Participant.findById(message.participant)
    await sendToWatchers(conversation._id, [message.serialize])
  }

}
