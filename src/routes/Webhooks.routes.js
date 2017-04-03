export default [

  /*
  * This route is the webhook shared with a channel
  * Depending on incomming request, it automatically detect which channel message is comming from.
  * In many cases, this webhook is automatically registered onto right channel (Kik for example).
  * Check our documentation for more info.
  */
  {
    method: 'POST',
    path: '/webhook/:channel_id',
    validators: [],
    handler: controllers.Webhooks.forwardMessage,
  },

  /*
  * This route is a specific Facebook endpoint.
  * Facebook needs a GET endpoint on same route as webhook one to validate this webhook
  */
  {
    method: 'GET',
    path: '/webhook/:channel_id',
    validators: [],
    handler: controllers.Webhooks.subscribeFacebookWebhook,
  },
]
