import controller from './controller'

export default [
  {
    method: 'GET',
    path: ['/connectors/:connectorId/channels/:channel_slug/amazon/vendors'],
    validators: [],
    authenticators: [],
    handler: controller.getVendors,
  },
  {
    method: 'GET',
    path: ['/connectors/:connectorId/channels/:channel_slug/amazon/locales'],
    validators: [],
    authenticators: [],
    handler: controller.getSupportedLocales,
  },
  {
    method: 'POST',
    path: ['/connectors/connectorId/channels/:channel_slug/amazon/deploy'],
    validators: [],
    authenticators: [],
    handler: controller.deploy,
  },
]
