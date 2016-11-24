module.exports = (method, routePath) => {
  const router = global.app._router.stack.filter(middleware => middleware.name === 'router')

  if (!router || router.length < 1) {
    return null
  }

  const routes = router[0].handle.stack.filter(route => route.route.methods[method.toLowerCase()] && routePath.match(route.regexp))

  if (!routes || routes.length < 1) {
    return null
  }

  const stack = routes[0].route.stack

  if (!stack || stack.length < 1) {
    return null
  }

  // We take the last function, because the previous ones are middleware
  return stack[stack.length - 1].handle
}
