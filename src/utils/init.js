import fs from 'fs'

const getServiceName = service => service.split('.')[0].toLowerCase()

/**
 * Load every services in a global object
 */
export function initServices () {
  const files = fs.readdirSync(`${__dirname}/../services`)
  const services = {}

  for (const file of files) {
    const serviceName = getServiceName(file)
    const service = require(`${__dirname}/../services/${file}`)
    services[serviceName] = service.default

    services[serviceName].onLaunch()
  }

  global.services = services
}
