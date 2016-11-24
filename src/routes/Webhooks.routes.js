import WebhooksController from '../controllers/Webhooks.controller.js'
import * as webhookValidators from '../validators/Webhooks.validators.js'

export default [
  /*
  * This route is the webhook sharing wiht channel
  * Depending on incomming request, it automatically detect which channel message is comming from.
  * In many cases, this webhook is automatically registered onto right channel (Kik for example).
  * Check our documentation for more info.
  */
  {
    method: 'POST',
    path: '/webhook/:channel_id',
    validators: [webhookValidators.forwardMessage],
    handler: WebhooksController.forwardMessage,
  },

  /*
  * This route is a specific Facebook endpoint.
  * Facebook needs a GET endpoint on same route as webhook one to validate this webhook
  */
  {
    method: 'GET',
    path: '/webhook/:channel_id',
    validators: [webhookValidators.subscribeFacebookValidator],
    handler: WebhooksController.subscribeFacebookWebhook,
  },

]
