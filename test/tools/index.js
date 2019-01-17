export function fetchMethod (routesArray, method, path) {
  for (let route of routesArray) {
    // If methods match
    // and    route.path is a string and match
    //        or route.path is an array and match
    if (route.method.toLowerCase() === method.toLowerCase() && ((typeof route.path === 'string' && route.path === path) || (typeof route.path === 'object' && route.path.indexOf(path) >= 0))) {
        return route.handler
    }
  }

  return null
}

export { setupChannelIntegrationTests } from './integration_setup'
