import {
  facebookGetAppId,
  facebookGetAppToken,
  facebookGetClientTokenInformation,
} from './sdk'
import { BadRequestError, ForbiddenError } from '../../utils'

const CLIENT_TOKEN_PERMS = [
  'public_profile',
  'email',
  'manage_pages',
  'pages_messaging',
  'pages_messaging_subscriptions',
]

export const validateFacebookParams = async (req) => {
  const { facebook_token: clientToken, facebook_user: clientId } = req.query
  if (!clientToken || !clientId) {
    throw new BadRequestError('Missing facebook_token, facebook_expiry or facebook_user parameter')
  }

  const appToken = await facebookGetAppToken()

  await validateFacebookToken(clientId, clientToken, appToken)

  req.clientId = clientId
  req.clientToken = clientToken
  req.appToken = appToken
}

export const validateFacebookToken = async (clientId, clientToken, appToken) => {
  const {
    data: {
      app_id: clientTokenAppId,
      type: clientTokenType,
      is_valid: clientTokenIsValid,
      user_id: clientTokenUserId,
      scopes: clientTokenScopes,
    },
  } = await facebookGetClientTokenInformation(clientToken, appToken)

  if (
    !clientTokenIsValid
    || clientTokenType !== 'USER'
    || (clientId && clientTokenUserId !== clientId)
    || clientTokenAppId !== facebookGetAppId()
    || !CLIENT_TOKEN_PERMS.every((perm) => clientTokenScopes.includes(perm))
  ) {
    throw new ForbiddenError()
  }

  return clientTokenUserId
}
