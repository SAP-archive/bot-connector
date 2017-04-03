import SlackAppService from '../services/SlackApp.service'

export default [
  {
    method: 'GET',
    path: '/oauth/slack/:channel_id',
    validators: [],
    handler: SlackAppService.receiveOauth,
  },
]
