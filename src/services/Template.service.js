import { noop } from '../utils'

import { BadRequestError } from '../utils/errors'

export default class ServiceTemplate {

  /* Check parameters validity to create a Channel */
  static checkParamsValidity = () => true

  /* Call when a channel is created */
  static onChannelCreate = noop

  /* Call when a channel is updated */
  static onChannelUpdate = noop

  /* Call when a channel is deleted */
  static onChannelDelete = noop

  /* Check webhook validity for certain channels (Messenger) */
  static onWebhookChecking = () => {
    throw new BadRequestError('Unimplemented service method')
  }

  /* Call when a message is received for security purpose */
  static checkSecurity = (req, res) => {
    res.status(200).send()
  }

  /* Perform operations before entering the pipeline */
  static beforePipeline = (req, res, channel) => channel

  /* Call before entering the pipeline, to build the options object */
  static extractOptions = noop

  /* Call to get the raw message from the received request */
  static getRawMessage = (channel, req) => req.body

  /* Call before entering the pipeline, to send a isTyping message */
  static sendIsTyping = noop

  /* Call to update a conversation based on data from the message */
  static updateConversationWithMessage = (conversation, msg, opts) => { return Promise.all([conversation, msg, opts]) }

  /* Call to parse a message received from a channel */
  static parseChannelMessage = noop

  /* Call to format a message received by the bot */
  static formatMessage = noop

  /* Call to send a message to a bot */
  static sendMessage = noop

  /*
   * Gromit specific methods
   */

  static formatParticipantData = () => ({})

  static getParticipantInfos = participant => participant

}
