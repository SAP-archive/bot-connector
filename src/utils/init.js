import _ from 'lodash'

/**
 * Starts all services
 */
export function initServices () {

  _.forOwn(services, (service) => {
    service.onLaunch()
  })
}
