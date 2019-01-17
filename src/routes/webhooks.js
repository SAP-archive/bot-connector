import WebhookController from '../controllers/webhooks'

export default [
  {
    method: 'POST',
    path: ['/webhook/service/:channel_type'],
    validators: [],
    authenticators: [],
    handler: WebhookController.serviceHandleMethodAction,
  },
  {
    method: 'GET',
    path: ['/webhook/service/:channel_type'],
    validators: [],
    authenticators: [],
    handler: WebhookController.serviceHandleMethodAction,
  },
  {
    method: 'POST',
    path: ['/webhook/:channel_id'],
    validators: [],
    authenticators: [],
    handler: WebhookController.handleMethodAction,
  },
  {
    method: 'GET',
    path: ['/webhook/:channel_id'],
    validators: [],
    authenticators: [],
    handler: WebhookController.handleMethodAction,
  },
  {
    method: 'POST',
    path: ['/webhook/:channel_id/conversations'],
    validators: [],
    authenticators: [],
    handler: WebhookController.createConversation,
  },
  {
    method: 'GET',
    path: ['/webhook/:channel_id/conversations/:conversation_id/messages'],
    validators: [],
    authenticators: [],
    handler: WebhookController.getMessages,
  },
  {
    method: 'GET',
    path: ['/webhook/:channel_id/preferences'],
    validators: [],
    authenticators: [],
    handler: WebhookController.getPreferences,
  },
  {
    method: 'GET',
    path: ['/webhook/:channel_id/conversations/:conversation_id/poll'],
    validators: [],
    authenticators: [],
    handler: WebhookController.poll,
  },
]
