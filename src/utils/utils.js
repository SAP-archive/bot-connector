import is from 'is_js'
import md5 from 'blueimp-md5'

export function getWebhookToken (id, slug) {
  return md5(id.toString().split('').reverse().join(''), slug)
}

export function noop () {
  return Promise.resolve()
}

/**
 *  * Invoke an async service method
 *   */
export async function invoke (serviceName, methodName, args) {
  return global.services[serviceName][methodName](...args)
}

/**
 *  * Invoke a sync service method
 *   */
export function invokeSync (serviceName, methodName, args) {
  return global.services[serviceName][methodName](...args)
}

/**
 *  * Check if an url is valid
 *   */
export const isInvalidUrl = url => (!url || (!is.url(url) && !(/localhost/).test(url)))
