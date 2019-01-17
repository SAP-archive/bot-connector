import { isInvalidUrl } from '../utils'
import { BadRequestError } from '../utils/errors'

export const createConnector = (req) => {
  const url = req.body.url

  if (!url) {
    throw new BadRequestError('Parameter url is missing')
  } else if (isInvalidUrl(url)) {
    throw new BadRequestError('Parameter url is invalid')
  }
}

export const updateConnector = (req) => {
  const url = req.body.url

  if (url && isInvalidUrl(url)) {
    throw new BadRequestError('Parameter url is invalid')
  }
}
