import _ from 'lodash'

const AUTH_HEADERS = [
  'authorization',
  'x-recast-user',
]

const getAuthHeaders = (headers) => _.pickBy(headers, (_value, key) => AUTH_HEADERS.includes(key))

module.exports = {
  AUTH_HEADERS,
  getAuthHeaders,
}
