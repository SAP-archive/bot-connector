import AppController from '../controllers/application'

export default [
  {
    method: 'GET',
    path: ['/'],
    validators: [],
    authenticators: [],
    handler: AppController.index,
  },
  {
    method: 'POST',
    path: ['/'],
    validators: [],
    authenticators: [],
    handler: AppController.index,
  },
]
