import GetStartedButtonController from '../controllers/get_started_buttons'

export default [
  {
    method: 'POST',
    path: ['/connectors/:connectorId/channels/:channel_id/getstartedbuttons'],
    validators: [],
    authenticators: [],
    handler: GetStartedButtonController.create,
  },
  {
    method: 'GET',
    path: ['/connectors/:connectorId/channels/:channel_id/getstartedbuttons'],
    validators: [],
    authenticators: [],
    handler: GetStartedButtonController.show,
  },
  {
    method: 'PUT',
    path: ['/connectors/:connectorId/channels/:channel_id/getstartedbuttons'],
    validators: [],
    authenticators: [],
    handler: GetStartedButtonController.update,
  },
  {
    method: 'DELETE',
    path: ['/connectors/:connectorId/channels/:channel_id/getstartedbuttons'],
    validators: [],
    authenticators: [],
    handler: GetStartedButtonController.delete,
  },
]
