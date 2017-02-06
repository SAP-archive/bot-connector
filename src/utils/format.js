import _ from 'lodash'

export const messageTypes = ['text', 'picture', 'video', 'quickReplies', 'card', 'carouselle', 'audio']

export function isValidFormatMessage (message) {
  if (!_.isObject(message)
      || !message.type || !message.content
      || messageTypes.indexOf(message.type) === -1) {
    return false
  }

  if (message.type === 'text' && !_.isString(message.content)) { return false }
  if (message.type === 'picture' && !_.isString(message.content)) { return false }
  if (message.type === 'video' && !_.isString(message.content)) { return false }
  if (message.type === 'quickReplies' && !_.isObject(message.content)) { return false }
  if (message.type === 'card' && !_.isObject(message.content)) { return false }

  return true
}
