import _ from 'lodash'
import { createHmac } from 'crypto'
import Promise from 'bluebird'
import Graph from 'fbgraph'
import config from '../../../config'
import { ServiceError } from '../../utils'

Graph.setVersion('2.11')
Promise.promisifyAll(Graph)

export const facebookGetAppId = () => config.facebook_app_id
const getAppSecret = () => config.facebook_app_secret

const getOAuthToken = async (appId, appSecret, params) => {
  const response = await Graph.getAsync('/oauth/access_token', {
    client_id: appId,
    client_secret: appSecret,
    ...params,
  })
  return response
}

export const facebookGetAppToken = async () => {
  const appId = facebookGetAppId()
  const appSecret = getAppSecret()
  const response = await getOAuthToken(appId, appSecret, { grant_type: 'client_credentials' })

  const { access_token: appToken, token_type: appTokenType } = response
  if (!appToken || appTokenType !== 'bearer') {
    throw new ServiceError('Error while requesting facebook application token')
  }
  return appToken
}

export const facebookGetClientTokenInformation = async (clientToken, appToken) => {
  const response = await Graph.getAsync('/debug_token', {
    input_token: clientToken,
    access_token: appToken,
  })
  return response
}

const getAuthSecureParams = (token, appSecret) => {
  const hmac = createHmac('sha256', appSecret)
  hmac.update(token)
  return {
    access_token: token,
    appsecret_proof: hmac.digest('hex'),
  }
}

export const facebookGetClientToken = async (code, redirectUri, appToken) => {
  const appId = facebookGetAppId()
  const appSecret = getAppSecret()
  const authSecureParams = getAuthSecureParams(appToken, appSecret)

  const response = await getOAuthToken(appId, appSecret, {
    redirect_uri: redirectUri,
    code,
    ...authSecureParams,
  })

  return response
}

export const facebookGetExtendedClientToken = async (clientToken) => {
  const appId = facebookGetAppId()
  const appSecret = getAppSecret()
  const authSecureParams = getAuthSecureParams(clientToken, appSecret)

  const response = await getOAuthToken(appId, appSecret, {
    grant_type: 'fb_exchange_token',
    fb_exchange_token: clientToken,
    ...authSecureParams,
  })

  return response
}

export const facebookGetProfile = async (clientToken, fields) => {
  const appSecret = getAppSecret()
  const authSecureParams = getAuthSecureParams(clientToken, appSecret)

  const data = await Graph.getAsync('/me', {
    fields,
    ...authSecureParams,
  })
  return data
}

export const facebookGetUserData = async (userId, pageToken, fields, appSecret) => {
  const properAppSecret = appSecret || getAppSecret()
  const authSecureParams = getAuthSecureParams(pageToken, properAppSecret)

  const data = await Graph.getAsync(`/${userId}`, {
    fields,
    ...authSecureParams,
  })
  return data
}

const messageMethod = async (messageData, pageToken, appSecret) => {
  const properAppSecret = appSecret || getAppSecret()
  const authSecureParams = getAuthSecureParams(pageToken, properAppSecret)

  const data = await Graph.postAsync('/me/messages', {
    ...authSecureParams,
    ...messageData,
  })
  return data
}

export const facebookSendMessage = async (message, pageToken, appSecret) => {
  await messageMethod(message, pageToken, appSecret)
}

export const facebookSendIsTyping = async (recipientId, pageToken, appSecret) => {
  const data = {
    recipient: { id: recipientId },
    sender_action: 'typing_on',
  }
  await messageMethod(data, pageToken, appSecret)
}

const getUserPagesRecursive = async (params, after = undefined) => {
  const requestParams = _.omitBy({
    ...params,
    after,
  }, _.isNil)

  const { data, paging: { next, cursors: { after: afterCursor } } }
    = await Graph.getAsync('/me/accounts', requestParams)

  if (next) {
    return [
      ...data,
      ...getUserPagesRecursive(params, afterCursor),
    ]
  }
  return data
}

export const facebookGetUserPages = async (clientToken) => {
  const appSecret = getAppSecret()
  const authSecureParams = getAuthSecureParams(clientToken, appSecret)

  const pages = await getUserPagesRecursive(authSecureParams)
  return pages
}

export const facebookGetPagesTokens = async (pageIds, clientToken) => {
  const appSecret = getAppSecret()
  const authSecureParams = getAuthSecureParams(clientToken, appSecret)

  const batchRequests = pageIds.reduce((acc, pageId) => {
    return [
      ...acc,
      {
        method: 'GET',
        relative_url: `${pageId}?fields=access_token`,
      },
    ]
  }, [])

  const response = await Graph.batchAsync(batchRequests, authSecureParams)
  const filteredResponse = response.map(r => {
    const body = r.body ? JSON.parse(r.body) : null
    if (!body) {
      throw new ServiceError('Error while getting facebook pages tokens')
    }
    return [body.id, body.access_token]
  })
  return filteredResponse
}

export const facebookGetPagesPictures = async (pageIds, appToken) => {
  const appSecret = getAppSecret()
  const authSecureParams = getAuthSecureParams(appToken, appSecret)

  const batchRequests = pageIds.reduce((acc, pageId) => {
    return [
      ...acc,
      {
        method: 'GET',
        relative_url: `${pageId}/picture?redirect=0`,
      },
    ]
  }, [])

  const response = await Graph.batchAsync(batchRequests, authSecureParams)
  const filteredResponse = response.map(r => {
    const body = r.body ? JSON.parse(r.body) : null
    if (!body) {
      throw new ServiceError('Error while getting facebook pages pictures')
    }
    return body.data
  })
  return filteredResponse
}

export const facebookAddAppToPage = async (pageId, pageToken) => {
  const appSecret = getAppSecret()
  const authSecureParams = getAuthSecureParams(pageToken, appSecret)

  const { success } = await Graph.postAsync(`/${pageId}/subscribed_apps`, {
    ...authSecureParams,
  })
  return success
}

export const facebookRemoveAppFromPage = async (pageId, pageToken) => {
  const appSecret = getAppSecret()
  const authSecureParams = getAuthSecureParams(pageToken, appSecret)

  const { success } = await Graph.delAsync(`/${pageId}/subscribed_apps`, {
    ...authSecureParams,
  })
  return success
}

export const facebookGetAppWebhookToken = () => config.facebook_app_webhook_token

export const facebookComputeSignature = (rawBody, appSecret) => {
  const properAppSecret = appSecret || getAppSecret()

  const hmac = createHmac('sha1', properAppSecret)
  hmac.update(rawBody, 'utf-8')
  const digest = hmac.digest('hex')
  return `sha1=${digest}`
}

export const facebookAddProfileProperties = async (properties, pageToken) => {
  await Graph.postAsync(`/me/messenger_profile?access_token=${pageToken}`, { ...properties })
}

export const facebookDelProfileProperties = async (properties, pageToken) => {
  const fields = { fields: properties }
  await Graph.delAsync(`/me/messenger_profile?access_token=${pageToken}`, { ...fields })

}
