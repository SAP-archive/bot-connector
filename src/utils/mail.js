import archiver from 'archiver'
import nodemailer from 'nodemailer'

import { logger } from './index'
import config from '../../config'

export const fmtMessageDate = (message) => {
  const date = message.receivedAt || message.createdAt || new Date()
  return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
}

export const fmtConversationHeader = (conversation, participants) => {
  const user = participants.find(p => !p.isBot)
  const userInformations = user && user.data
    ? 'Participant informations:\n'
      + `- SenderId: ${user.senderId}\n`
      + `${Object.keys(user.data).map(k => `- ${k}  =>  ${user.data[k]}`).join('\n')}\n`
    : `Participant informations:\n- SenderId: ${user && user.senderId}\n`
  const conversationInformations = `Conversation informations:
- Chat ID: ${conversation._id}
- created: ${conversation.createdAt}
  `

  return `${conversationInformations}\n${userInformations}\n`
}

export async function sendArchiveByMail (message) {
  const archive = archiver('zip', {
    zlib: { level: 9 },
  })

  archive.on('error', err => {
    logger.error(`Failed to create the zip archive: ${err}`)
    throw err
  })

  for (const file of message.attachments) {
    archive.append(file.content, { name: file.filename })
  }
  archive.finalize()

  return sendMail({
    ...message,
    attachments: [{ content: archive, filename: 'conversations.zip' }],
  })
}

export function sendMail (message) {
  return nodemailer.createTransport(config.mail)
    .sendMail(message)
}
