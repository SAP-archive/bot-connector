
import { notFoundError, handleMongooseError } from '../utils/errors'

export default class ConversationController {

  /*
  * Index all bot's conversations
  */
  static getConversationsByBotId (req, res) {
    Bot.findOne({ _id: req.params.bot_id })
      .populate('conversations')
      .exec()
      .then(foundBot => {
        if (!foundBot) { return Promise.reject(new notFoundError('Bot')) }
        if (!foundBot.conversations || !foundBot.conversations.length) { return res.json({ results: [], message: 'No conversations' }) }

        res.json({ results: foundBot.conversations.filter(conversation => conversation.isActive).map(conversation => conversation.serialize), message: 'Conversations successfully rendered' })
      })
      .catch(err => handleMongooseError(err, res, 'Error while getting Conversations'))
  }

  /*
  * Show a conversation
  */
  static getConversationByBotId (req, res) {
    Conversation.findOne({ _id: req.params.conversation_id })
      .populate('participants messages')
      .exec()
      .then(foundConversation => {
        if (!foundConversation || !foundConversation.isActive) { return Promise.reject(new notFoundError('Conversation')) }

        foundConversation.participants = foundConversation.participants.map(participant => participant.serialize)
        foundConversation.messages = foundConversation.messages.map(message => message.serialize)
        res.json({ results: foundConversation.full, message: 'Conversation successfully rendered' })
      })
      .catch(err => handleMongooseError(err, res, 'Error while getting Conversations'))
  }

  /*
  * Soft-delete a conversation (isActive = false)
  */
  static deleteConversationByBotId (req, res) {
    Conversation.findOne({ _id: req.params.conversation_id })
      .then(foundConversation => {

        if (!foundConversation || !foundConversation.isActive) { return Promise.reject(new notFoundError('Conversation')) }

        foundConversation.isActive = false

        return foundConversation.save()
      })
      .then(() => res.status(204).send())
      .catch(err => handleMongooseError(err, res, 'Error while getting Conversations'))
  }
}
