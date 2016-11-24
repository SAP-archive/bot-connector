import AppController from '../controllers/App.controller.js'

export default [
  {
    method: 'GET',
    path: '/',
    validators: [],
    handler: AppController.index,
  },
  {
    method: 'POST',
    path: '/',
    validators: [],
    handler: AppController.index,
  },
]
