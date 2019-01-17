import filter from 'filter-object'

import * as channelConstants from '../constants/channels'
import { BadRequestError } from '../utils/errors'
import { Channel } from '../models'
import { getChannelIntegrationByIdentifier } from '../channel_integrations'
import validatorConfig from './validators-config'

const throwErrIfStringExceedsMax = (str, max, errDisplayName) => {
  if (str && (str.length > max)) {
    throw new BadRequestError(`${errDisplayName} should be at most ${max} characters long`)
  }
}

const throwErrIfPlaceholderExceedsMax = (placeholderText) => {
  return () => throwErrIfStringExceedsMax(
    placeholderText, validatorConfig.USER_INPUT_PLACEHOLDER_MAX, 'User input placeholder')
}

export async function createChannelByConnectorId (req) {
  const slug = req.body.slug
  const type = req.body.type
  const inputPlaceholder = req.body.userInputPlaceholder
  const newChannel = new Channel(filter(req.body, channelConstants.permitted))

  if (!type) {
    throw new BadRequestError('Parameter type is missing')
  } else if (!slug) {
    throw new BadRequestError('Parameter slug is missing')
  } else if (!getChannelIntegrationByIdentifier(type)) {
    throw new BadRequestError('Parameter type is invalid')
  }
  throwErrIfPlaceholderExceedsMax(inputPlaceholder)()

  const channelIntegration = getChannelIntegrationByIdentifier(newChannel.type)
  channelIntegration.validateChannelObject(newChannel)
}

export const updateChannel = (req) => {
  const slug = req.body.slug

  if (slug === '') {
    throw new BadRequestError('Parameter slug cannot be empty')
  }
  throwErrIfPlaceholderExceedsMax(req.body.userInputPlaceholder)()
}
