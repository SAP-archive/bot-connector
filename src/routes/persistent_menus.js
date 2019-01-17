import PersistentMenuController from '../controllers/persistent_menus'

export default [
  {
    method: 'POST',
    path: ['/connectors/:connectorId/persistentmenus'],
    validators: [],
    authenticators: [],
    handler: PersistentMenuController.create,
  },
  {
    method: 'POST',
    path: ['/connectors/:connectorId/persistentmenus/setdefault'],
    validators: [],
    authenticators: [],
    handler: PersistentMenuController.setDefault,
  },
  {
    method: 'GET',
    path: ['/connectors/:connectorId/persistentmenus/:language'],
    validators: [],
    authenticators: [],
    handler: PersistentMenuController.show,
  },
  {
    method: 'GET',
    path: ['/connectors/:connectorId/persistentmenus'],
    validators: [],
    authenticators: [],
    handler: PersistentMenuController.index,
  },
  {
    method: 'PUT',
    path: ['/connectors/:connectorId/persistentmenus/:language'],
    validators: [],
    authenticators: [],
    handler: PersistentMenuController.update,
  },
  {
    method: 'DELETE',
    path: ['/connectors/:connectorId/persistentmenus/:language'],
    validators: [],
    authenticators: [],
    handler: PersistentMenuController.delete,
  },
  {
    method: 'DELETE',
    path: ['/connectors/:connectorId/persistentmenus'],
    validators: [],
    authenticators: [],
    handler: PersistentMenuController.deleteAll,
  },
]
