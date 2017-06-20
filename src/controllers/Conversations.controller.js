import _ from 'lodash'

import { Logger } from '../utils'
import { renderOk, renderDeleted } from '../utils/responses'
import { NotFoundError, BadRequestError } from '../utils/errors'

export default class ConversationController {

  static async index (req, res) {
    const { connector_id } = req.params

    const conversations = models.Conversation.find({ connector: connector_id })

    return renderOk(res, {
      results: conversations.map(c => c.serialize),
      message: conversations.length ? 'Conversations successfully found' : 'No conversations',
    })
  }

  static async show (req, res) {
    const { connector_id, conversation_id } = req.params

    const conversation = await global.models.Conversation.findOne({ _id: conversation_id, connector: connector._id })
      .populate('participants messages')

    if (!conversation) {
      throw new NotFoundError('Conversation')
    }

    return renderOk(res, {
      results: conversation.full,
      message: 'Conversation successfully found',
    })
  }

  static async delete (req, res) {
    const { connector_id, conversation_id } = req.params

    const conversations = await global.models.Conversation.findOne({ _id: conversation_id, connector: connector_id })

    if (!conversation) {
      throw new NotFoundError('Conversation')
    }

    await conversation.remove()

    return renderDeleted(res, 'Conversation successfully deleted')
  }
  /*
   * Find or create a conversation
   */
  static async findOrCreateConversation (channelId, chatId) {
    let conversation = await global.models.Conversation.findOne({ channel: channelId, chatId })
      .populate('channel')
      .populate('connector', 'url _id')
      .populate('participants')
      .exec()

    if (conversation) {
      return conversation
    }

    const channel = await global.models.Channel.findById(channelId).populate('connector').exec()

    if (!channel) {
      throw new NotFoundError('Channel')
    } else if (!channel.isActivated) {
      throw new BadRequestError('Channel is not activated')
    }

    const connector = channel.connector

    if (!connector) {
      throw new NotFoundError('Bot')
    }

    conversation = await new global.models.Conversation({ connector: connector._id, chatId, channel: channel._id }).save()
    connector.conversations.push(conversation._id)
    await global.models.Connector.update({ _id: connector._id }, { $push: { conversations: conversation._id } })

    conversation.connector = connector
    conversation.channel = channel
    return conversation
  }

}
