import AmazonAlexa from './amazon_alexa/channel'
import Callr from './callr/channel'
import CiscoSpark from './cisco_spark/channel'
import Kik from './kik/channel'
import Line from './line/channel'
import Messenger from './facebook/channel'
import Microsoft from './microsoft/channel'
import Slack from './slack/channel'
import SlackApp from './slack_app/channel'
import Telegram from './telegram/channel'
import Twilio from './twilio/channel'
import Twitter from './twitter/channel'
import Webchat from './webchat/channel'

export default {
  AmazonAlexa,
  Callr,
  CiscoSpark,
  Kik,
  Line,
  Messenger,
  Microsoft,
  Slack,
  SlackApp,
  Telegram,
  Twilio,
  Twitter,
  Webchat,
}
/**
 * Lists the names of all available channel integration modules
 * @type {string[]}
 */
export const MODULES = [
  'amazon_alexa',
  'callr',
  'cisco_spark',
  'facebook',
  'kik',
  'line',
  'microsoft',
  'slack',
  'slack_app',
  'telegram',
  'twilio',
  'twitter',
  'webchat',
]

function getChannelModules () {
  return MODULES.map(moduleName => require(`./${moduleName}`))
}

/**
 * Collects all custom routes defined in channel integrations.
 * @return {Route[]} Array of route objects
 */
export function getChannelIntegrationRoutes () {
  const routeLists = getChannelModules()
    .map(module => module.routes || [])
    .filter(routes => routes.length)
  return [].concat(...routeLists)
}

/**
 * Retrieves an instance of a channel integration for a given identifier.
 * @param {string} identifier One of the channel integration identifier
 * @return {AbstractChannelIntegration} An instance of the channel integration matching
 * the given identifier
 */
export function getChannelIntegrationByIdentifier (identifier) {
  const module = getChannelModules().find(module => module.identifiers.includes(identifier))
  if (!module) {
    return undefined
  }
  return new module.channel()
}
