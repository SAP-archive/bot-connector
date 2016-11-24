import config from '../../config'
import ConversationController from '../../src/controllers/Conversations.controller'
import fetchMethod from '../services/fetchMethod.service'
const chai = require('chai')
const chaiHttp = require('chai-http')

const expect = chai.expect
chai.use(chaiHttp)

const Bot = require('../../src/models/Bot.model.js')

describe('Conversation Routes', () => {

  it('Should call function getConversationsByBotId: GET /bots/:bot_id/conversations', (done) => {
    chai.expect(fetchMethod('GET', '/bots/:bot_id/conversations')).to.equal(ConversationController.getConversationsByBotId)
    done()
  })

  it('Should call function getConversationByBotId: GET /bots/:bot_id/conversations/conversation_id', (done) => {
    //chai.expect(fetchMethod('GET', '/bots/:bot_id/conversations/conversation_id')).to.equal(ConversationController.getConversationByBotId)
    chai.expect(fetchMethod('GET', '/bots/:bot_id/conversations/:conversation_id')).to.equal(ConversationController.getConversationByBotId)
    done()
  })

  it('Should call function deleteConversationByBotId: DELETE /bots/:bot_id/conversations/:conversation_id', (done) => {
    chai.expect(fetchMethod('DELETE', '/bots/:bot_id/conversations/:conversation_id')).to.equal(ConversationController.deleteConversationByBotId)
    done()
  })
})
