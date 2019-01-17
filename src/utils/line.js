import superagent from 'superagent'
import superagentPromise from 'superagent-promise'

import { ServiceError } from './'

const agent = superagentPromise(superagent, Promise)

const getLineApiUrl = url => `https://api.line.me/${url}`

export const lineSendMessage = async (clientToken, replyToken, messages) => {
  // Line only supports up to 5 messages in one request, but the replyToken can
  // only be used once. Therefore, we only send the first 5 messages for now.
  await agent.post(getLineApiUrl('v2/bot/message/reply'))
    .set('Content-Type', 'application/json')
    .set('Authorization', `Bearer ${clientToken}`)
    .send({
      replyToken,
      messages: messages.slice(0, 5),
    })
}

export const lineGetUserProfile = async (clientToken, userId) => {
  try {
    const { body } = await agent.get(getLineApiUrl(`v2/bot/profile/${userId}`))
    .set('Authorization', `Bearer ${clientToken}`)

    return body
  } catch (error) {
    throw new ServiceError('Error while retrieving line user profile information')
  }
}
