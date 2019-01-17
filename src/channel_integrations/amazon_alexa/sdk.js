import Promise from 'bluebird'
import superagent from 'superagent'
import superagentPromise from 'superagent-promise'
import _ from 'lodash'
import assert from 'assert'

const agent = superagentPromise(superagent, Promise)

export class AlexaSMAPIError extends Error {
  constructor (message = '', body = {}, status = 500) {
    super(message)
    this.constructor = AlexaSMAPIError
    // eslint-disable-next-line no-proto
    this.__proto__ = AlexaSMAPIError.prototype
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
    this.status = status
    this.message = _.get(body, 'message', '')
  }
}

export default class AlexaSMAPI {

  static locales = ['en-US', 'en-GB', 'de-DE', 'en-CA', 'en-IN', 'en-AU', 'ja-JP']

  constructor (accessToken,
               api = 'https://api.amazonalexa.com') {
    this.accessToken = accessToken
    this.api = api
  }

  async _callApi ({ url, method = 'GET', query = {}, payload = {} }) {
    try {
      const request = agent(method, url)
        .set('Authorization', this.accessToken)
        .query(query)

      if (!_.isEmpty(payload)) {
        request.send(payload)
      }
      const { body, status } = (await request.end())
      return { body, status }
    } catch (err) {
      throw new AlexaSMAPIError(err.message, err.response.body, err.response.statusCode)
    }
  }

  async getSkill (skillId, stage = 'development') {
    const url = `${this.api}/v1/skills/${skillId}/stages/${stage}/manifest`
    return this._callApi({ url })
  }

  async createSkill (vendorId, manifest) {
    const url = `${this.api}/v1/skills`
    const method = 'POST'
    const payload = { vendorId, manifest }
    return this._callApi({ url, method, payload })
  }

  async updateSkill (skillId, manifest, stage = 'development') {
    const url = `${this.api}/v1/skills/${skillId}/stages/${stage}/manifest`
    const method = 'PUT'
    const payload = { manifest }
    return this._callApi({ url, method, payload })
  }

  async getSkillStatus (skillId, resource = []) {
    const url = `${this.api}/v1/skills/${skillId}/status`
    const query = { resource }
    return this._callApi({ url, query })
  }

  async listSkills ({ vendorId, skillId = [], maxResults, nextToken }) {
    try {
      if (!_.isEmpty(skillId)) {
        assert(_.isUndefined(maxResults))
        assert(_.isUndefined(nextToken))
      }
      if (_.isArray(skillId)) {
        assert(skillId.length <= 10)
      }
      if (!_.isUndefined(maxResults)) {
        assert(maxResults <= 50)
      }
    } catch (err) {
      throw new AlexaSMAPIError(
        `Parameters don't fulfill requirements:
        - 'maxResults' and 'nextToken' must not be used when 'skillId' is in use.
        - One request can include up to 10 'skillId' values.
        - The value of maxResults must not exceed 50.`
      )
    }
    const url = `${this.api}/v1/skills`
    const query = { vendorId, skillId, maxResults, nextToken }
    return this._callApi({ url, query })
  }

  async deleteSkill (skillId) {
    const url = `${this.api}/v1/skills/${skillId}`
    const method = 'DELETE'
    return this._callApi({ url, method })
  }

  async getInteractionModel (skillId, locale, stage = 'development') {
    const url = `${this.api}/v1/skills/${skillId}/stages/${stage}`
                + `/interactionModel/locales/${locale}`
    return this._callApi({ url })
  }

  async headInteractionModel (skillId, locale, stage = 'development') {
    const url = `${this.api}/v1/skills/${skillId}/stages/${stage}`
                + `/interactionModel/locales/${locale}`
    const method = 'HEAD'
    return this._callApi({ url, method })
  }

  async updateInteractionModel (skillId, locale, interactionModel, stage = 'development') {
    const url = `${this.api}/v1/skills/${skillId}/stages/${stage}`
                + `/interactionModel/locales/${locale}`
    const method = 'PUT'
    const payload = { interactionModel }
    return this._callApi({ url, method, payload })
  }

  async getVendors () {
    const url = `${this.api}/v1/vendors`
    return this._callApi({ url })
  }
}
