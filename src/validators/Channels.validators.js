import filter from 'filter-object'

import { invoke } from '../utils'
import { BadRequestError } from '../utils/errors'

const permitted = '{type,slug,isActivated,token,userName,apiKey,webhook,clientId,clientSecret,password,phoneNumber,serviceId}'

export async function createChannelByConnectorId (req) {
  const { slug, type } = req.body
  const newChannel = new models.Channel(filter(req.body, permitted))

  if (!type) {
    throw new BadRequestError('Parameter type is missing')
  } else if (!slug) {
    throw new BadRequestError('Parameter slug is missing')
  } else if (!services[type]) {
    throw new BadRequestError('Parameter type is invalid')
  }

  await invoke(newChannel.type, 'checkParamsValidity', [newChannel])
}
