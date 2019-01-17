import PersistentMenu from '../../src/models/persistent_menu'

const build = async (connector, opts = {}) => {
  const data = {
    connector_id: connector._id,
    menu: opts.menu || {},
    default: opts.default || false,
    locale: opts.locale || 'en',
  }
  Object.keys(opts).forEach(k => {
    if (data[k] === undefined) {
      data[k] = opts[k]
    }
  })
  const persistentMenu = new PersistentMenu(data)

  return persistentMenu.save()
}

module.exports = { build }
