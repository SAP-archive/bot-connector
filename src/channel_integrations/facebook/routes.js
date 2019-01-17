import { validateFacebookParams } from './middlewares'
import controller from './controller'

export default [
  {
    method: 'GET',
    path: ['/facebook/token'],
    validators: [],
    authenticators: [],
    handler: controller.getTokenFromCode,
  },
  {
    method: 'GET',
    path: ['/facebook/refresh_token'],
    validators: [],
    authenticators: [validateFacebookParams],
    handler: controller.refreshToken,
  },
  {
    method: 'GET',
    path: ['/facebook/profile'],
    validators: [],
    authenticators: [validateFacebookParams],
    handler: controller.getProfile,
  },
  {
    method: 'GET',
    path: ['/facebook/pages'],
    validators: [],
    authenticators: [validateFacebookParams],
    handler: controller.getPages,
  },
]
