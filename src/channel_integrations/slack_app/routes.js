import SlackAppChannel from './channel'

export default [
  {
    method: 'GET',
    path: ['/oauth/slack/:channel_id'],
    validators: [],
    authenticators: [],
    handler: SlackAppChannel.receiveOauth,
  },
]
