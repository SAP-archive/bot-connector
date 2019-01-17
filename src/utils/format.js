import _ from 'lodash'
import { Validator } from 'jsonschema'

import { BadRequestError } from './'

const basicSchema = {
  id: '/Basic',
  type: 'object',
  properties: {
    type: { type: 'string' },
    content: { type: 'string' },
  },
  required: ['type', 'content'],
}

const buttonSchema = {
  id: '/Button',
  type: 'object',
  properties: {
    type: { type: 'string' },
    title: { type: 'string' },
    value: { type: 'string' },
  },
}

const buttonsSchema = {
  id: '/Buttons',
  type: 'object',
  properties: {
    content: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        buttons: {
          type: 'array',
          items: { $ref: '/Button' },
        },
      },
      required: ['buttons'],
    },
  },
  required: ['content'],
}

const quickRepliesSchema = {
  id: '/QuickReplies',
  type: 'object',
  properties: {
    type: { type: 'string' },
    content: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        buttons: {
          type: 'array',
          items: { $ref: '/Button' },
        },
      },
      required: ['title', 'buttons'],
    },
  },
  required: ['type', 'content'],
}

const customSchema = {
  id: '/Custom',
  type: 'object',
  properties: {
    content: {
      anyOf: [
        {
          type: 'object',
          patternProperties: {
            '^([A-Za-z0-9-_]+)$': {},
          },
          additionalProperties: false,
        },
        {
          type: 'array',
        },
        {
          type: 'string',
        },
      ],
    },
  },
  required: ['content'],
}

const val = new Validator()
val.addSchema(basicSchema, '/Basic')
val.addSchema(buttonSchema, '/Button')
val.addSchema(buttonsSchema, '/Buttons')
val.addSchema(quickRepliesSchema, '/QuickReplies')
val.addSchema(customSchema, '/Custom')

export const messageTypes = [
  'text',
  'conversation_start',
  'conversation_end',
  'picture',
  'video',
  'quickReplies',
  'card',
  'carouselle',
  'audio',
  'carousel',
  'list',
  'buttons',
  'custom',
]

export const validate = (message, schema) => {
  const { errors: [error] } = val.validate(message, schema)

  return error
}

export function isValidFormatMessage (message) {
  if (!_.isObject(message)
    || !message.type || !message.content
    || messageTypes.indexOf(message.type) === -1) {
    return false
  }

  const { type, content } = message
  if (type === 'text' && !_.isString(content)) { return false }
  if (type === 'conversation_start' && !_.isString(content)) { return false }
  if (type === 'conversation_end' && !_.isString(content)) { return false }
  if (type === 'picture' && !_.isString(content)) { return false }
  if (type === 'video' && !_.isString(content)) { return false }
  if (type === 'quickReplies' && !_.isObject(content)) { return false }
  if (type === 'card' && !_.isObject(content)) { return false }
  if (type === 'buttons' && !_.isObject(content)) { return false }
  if (type === 'custom'
    && !_.isObject(content)
    && !_.isArray(content)
  ) {
    return false
  }

  return true
}

export const textFormatMessage = (message, separator = '\n', buttonSeparator = '- ') => {
  const { attachment: { type, content } } = message

  let body = ''
  switch (type) {
  case 'text':
  case 'picture':
  case 'video': {
    body = content
    break
  }
  case 'list': {
    const { elements } = content
    body = _.reduce(elements, (acc, elem) => `${acc}${separator}`
      + `${separator}${elem.title}`
      + `${separator}${elem.subtitle}`
      + `${separator}${elem.imageUrl}`, '')
    break
  }
  case 'buttons':
  case 'quickReplies': {
    const { title, buttons } = content
    body = `${title}${separator}`
        .concat(buttons.map(b => `${buttonSeparator}${b.title}`)
        .join(separator))
    break
  }
  case 'card': {
    const { title, subtitle, imageUrl, buttons } = content
    body = _.reduce(buttons, (acc, b) =>
      `${acc}${separator}${buttonSeparator}${b.title}`,
      `${title}${separator}${subtitle}${separator}${imageUrl}`, '')
    break
  }
  case 'carouselle':
  case 'carousel': {
    body = _.reduce(content, (acc, card) => {
      const { title, subtitle, imageUrl, buttons } = card
      // eslint-disable-next-line prefer-template
      return acc + _.reduce(buttons, (acc, b) =>
        `${acc}${buttonSeparator}${b.title}${separator}`,
        `${title}${separator}${subtitle}${separator}${imageUrl}${separator}`, '') + separator
    }, '')
    break
  }
  default:
    throw new BadRequestError('Message type non-supported by text based service')
  }

  return { type, body }
}
