import { noop } from '../utils'

export default class ServiceTemplate {

  /* Call when the Connector is launched */
  static onLaunch = noop

  /* Check parameter validity to create a Channel */
  static checkParamsValidity = noop

  /* Call when a channel is created */
  static onChannelCreate = noop

  /* Call when a channel is updated */
  static onChannelUpdate = noop

  /* Call when a channel is deleted */
  static onChannelDelete = noop

  /* Call when a message is received for security purpose */
  static checkSecurity = noop

  /* Call when a message is received, before the pipeline */
  static beforePipeline = noop

  /* Call before entering the pipeline, to build the options object */
  static extractOptions = noop

  /* Call to parse a message received from a channel */
  static parseChannelMessage = noop

  /* Call to format a message received by the bot */
  static formatMessage = noop

  /* Call to send a message to a bot */
  static sendMessage = noop

}
