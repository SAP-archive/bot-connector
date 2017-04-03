import { renderOk, renderDeleted } from '../utils/responses'
import { NotFoundError, BadRequestError } from '../utils/errors'

export default class ConversationController {

  /*
  * Index all connector conversations
  */
  static async getConversationsByConnectorId (req, res) {
    const { connector_id } = req.params

    const conversations = await models.Conversation.find({ connector: connector_id })

    renderOk(res, {
      results: conversations.map(c => c.serialize),
      message: conversations.length ? 'Conversations rendered with success' : 'No conversations',
    })
  }

  /*
  * Show a conversation
  */
  static async getConversationByConnectorId (req, res) {
    const { connector_id, conversation_id } = req.params

    const conversation = await models.Conversation.findOne({ _id: conversation_id, connector: connector_id }).populate('participants messages')

    if (!conversation) { throw new NotFoundError('Conversation') }

    return renderOk(res, {
      results: conversation.full,
      message: 'Conversation rendered with success',
    })
  }

  /*
  * Delete a conversation
  */
  static async deleteConversationByConnectorId (req, res) {
    const { connector_id, conversation_id } = req.params

    const conversation = await models.Conversation.findOne({ _id: conversation_id, connector: connector_id })

    if (!conversation) { throw new NotFoundError('Conversation') }

    await conversation.remove()

    renderDeleted(res, 'Conversation deleted with success')
  }

  /*
   * Find or create a conversation
   */
  static async findOrCreateConversation (channelId, chatId) {
    let conversation = await models.Conversation.findOne({ channel: channelId, chatId })
      .populate('channel')
      .populate('connector', 'url _id')
      .populate('participants')
      .exec()

    if (conversation) { return conversation }

    const channel = await models.Channel.findById(channelId).populate('connector').exec()

    if (!channel) {
      throw new NotFoundError('Channel')
    } else if (!channel.isActivated) {
      throw new BadRequestError('Channel is not activated')
    }

    const { connector } = channel

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    conversation = await new models.Conversation({ connector: connector._id, chatId, channel: channel._id }).save()
    connector.conversations.push(conversation._id)
    await models.Connector.update({ _id: connector._id }, { $push: { conversations: conversation._id } })

    conversation.connector = connector
    conversation.channel = channel
    return conversation
  }

}
