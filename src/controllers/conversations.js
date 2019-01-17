import _ from 'lodash'
import moment from 'moment'
import archiver from 'archiver'

import { renderOk, renderDeleted } from '../utils/responses'
import { logger, fmtConversationHeader, sendMail,
         sendArchiveByMail, fmtMessageDate } from '../utils'
import { NotFoundError } from '../utils/errors'
import { Connector, Conversation, Message, Participant } from '../models'

export default class ConversationController {

  static async index (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const conversations = await Conversation
      .find({ connector: connector._id, isActive: true })

    return renderOk(res, {
      results: conversations.map(c => c.serialize),
      message: conversations.length ? 'Conversations successfully found' : 'No conversations',
    })
  }

  static async show (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    const conversation_id = req.params.conversation_id

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const conversation = await Conversation.findOne({
      _id: conversation_id,
      connector: connector._id,
      isActive: true,
    })

    if (!conversation) {
      throw new NotFoundError('Conversation')
    }

    const result = conversation.full
    result.participants = await Participant.find({ conversation: conversation._id })
    result.participants = result.participants.map(p => p.serialize)
    result.messages = await Message.find({
      conversation: conversation._id,
      isActive: true,
    }).sort('receivedAt')
    result.messages = result.messages.map(m => m.serialize)

    return renderOk(res, {
      results: result,
      message: 'Conversation successfully found',
    })
  }

  static async delete (req, res) {
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    const conversation_id = req.params.conversation_id

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const conversation = await Conversation.findOne({
      _id: conversation_id,
      connector: connector._id,
      isActive: true,
    })

    if (!conversation) {
      throw new NotFoundError('Conversation')
    }

    conversation.isActive = false
    await conversation.save()

    return renderDeleted(res, 'Conversation successfully deleted')
  }

  /*
   * Accepted parameters
   * - by: 'zip' || 'mail' - either returns the conversations as an archive in the
   *   request response, or send it by mail to the adresses specified
   * - to: "jerome.houdan@sap.com,jerome.houdan@gmail.com" - a list of email adresses
   *   separated by a comma
   * - from: "jerome.houdan@sap.com" - an email adress used as the sender
   * - populate: true || false - determine if we add the participant information and
   *   the reception date of the messages or not
   */
  static async dumpDelete (req, res) {
    const dump = []
    const connector = await Connector.findOne({ _id: req.params.connectorId, isActive: true })
    const { to, from, populate } = req.body
    const by = req.body.by || 'mail'
    const cutoff = moment().subtract(12, 'hours')
    let allConversations = ''

    if (!connector) {
      throw new NotFoundError('Connector')
    }

    const convModels = await Conversation
      .find({ connector: connector._id, createdAt: { $lt: cutoff } }, 'createdAt')

    const conversations = await Promise.all(convModels.map(async (conv) => {
      const participants = await Participant.find({ conversation: conv._id })
      const messages = await Message
        .find({ conversation: conv._id }, { attachment: 1, participant: 1, receivedAt: 1 })
        .populate('participant', 'isBot')
        .sort('receivedAt')
      return { conv, participants, messages }
    }))

    conversations
      .filter(c => c.messages.length)
      .forEach(({ conv, participants, messages }, i) => {
        const conversationHeader = populate
          ? fmtConversationHeader(conv, participants)
          : ''

        const content = messages.reduce((tmp, m) => {
          const messageContent = _.get(m, 'attachment.content', 'Empty message')
          const content = typeof messageContent === 'string'
            ? messageContent
            : `${messageContent.title}\n${messageContent.buttons.map(b => b.title).join(' | ')}`

          const participantType = _.get(m, 'participant.isBot', false) ? 'BOT' : 'USER'

          return populate
            ? `${tmp}${participantType} ${fmtMessageDate(m)} > ${content}\n`
            : `${tmp}${participantType} > ${content}\n`
        }, conversationHeader)
        allConversations += `${content}\n\n---------------------------\n\n`
        dump.push({ content: new Buffer(content, 'utf-8'), filename: `conversation-${i}.txt` })
      })

    if (dump.length && by === 'mail') {
      dump.push({ content: new Buffer(allConversations, 'utf-8'), filename: 'conversations.txt' })
      await sendArchiveByMail({
        to,
        from,
        subject: 'SAP Conversational AI daily logs',
        text: 'Bonjour\n\nCi-joint les logs quotidiens du chatbot.\n\nCordialement,',
        attachments: dump,
      })
    } else if (by === 'zip') {
      const archive = archiver('zip')
      res.attachment('conversations.zip')

      archive.on('end', () => res.end())
      archive.pipe(res)

      for (const file of dump) {
        archive.append(file.content, { name: file.filename })
      }

      archive.finalize()
    } else {
      await sendMail({
        to,
        from,
        subject: `Bot Connector ${connector._id}: Daily logs`,
        text: 'Bonjour\n\nIl n\'y a pas de logs de conversation aujourd\'hui.\n\nCordialement,',
      })
    }

    const conversationIds = conversations.map(c => c.conv._id)
    try {
      // Remove all the conversations, along with the messages and the
      // participants belonging to the conversations
      await Promise.all([
        Conversation.remove({ _id: { $in: conversationIds } }),
        Message.remove({ conversation: { $in: conversationIds } }),
        Participant.remove({ conversation: { $in: conversationIds } }),
      ])
    } catch (err) {
      logger.error(`Error while deleting conversations: ${err}`)
    }

    if (by !== 'zip') {
      return renderDeleted(res)
    }
  }
}
