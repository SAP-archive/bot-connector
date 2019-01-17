import expect from 'expect.js'
import agent from 'superagent'
import should from 'should'

import config from '../../config/test'
import '../util/start_application'
import Connector from '../../src/models/connector'
import Conversation from '../../src/models/conversation'
import Participant from '../../src/models/participant'

let connector = null
let conversation = null
let participant = null
let participant2 = null

let connector2 = null
let conversation2 = null
let participant3 = null

describe('Participants Controller Testing', () => {
  describe('Get all connector\'s participants', () => {
    describe('GET /participants', () => {
      before(done => {
        connector = new Connector()
        connector2 = new Connector()
        conversation = new Conversation()
        conversation2 = new Conversation()
        participant = new Participant()
        participant2 = new Participant()
        participant3 = new Participant()

        connector.url = 'http://myurl.com'

        conversation.channel = 'directline'
        conversation.connector = connector._id
        conversation.chatId = 'mychatid'

        participant.senderId = 'part1_senderId',
        participant.data = { name: 'part1' },
        participant.isBot = true,
        participant.conversation = conversation._id

        participant2.senderId = 'part2_senderId',
        participant2.data = { name: 'part2' },
        participant2.isBot = false,
        participant2.conversation = conversation._id

        connector2.url = 'http://myurl2.com'

        conversation2.channel = 'directline'
        conversation2.connector = connector2._id
        conversation2.chatId = 'mychatid2'

        participant3.senderId = 'part3_senderId',
        participant3.data = { name: 'part3' },
        participant3.isBot = true,
        participant3.conversation = conversation2._id

        connector.save(() => {
          connector2.save(() => {
            conversation.save(() => {
              conversation2.save(() => {
                participant.save(() => {
                  participant2.save(() => {
                    participant3.save(() => {
                      done()
                    })
                  })
                })
              })
            })
          })
        })
      })

      after(done => {
        connector = null
        connector2 = null
        conversation = null
        conversation2 = null
        participant = null
        participant2 = null
        participant3 = null
        Connector.remove(() => {
          Conversation.remove(() => {
            Participant.remove(() => {
              done()
            })
          })
        })
      })

      it('should work with developer_token', (done) => {
        agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector2._id}/participants`)
        .send()
        .end((err, result) => {
          should.not.exist(err)
          expect(result.status).to.be(200)
          expect(result.body.results).not.to.be(null)
          expect(result.body.results.length).to.be(1)
          expect(result.body.results[0].id).to.be(participant3._id)
          expect(result.body.results[0].isBot).to.be(participant3.isBot)
          expect(result.body.results[0].senderId).to.be(participant3.senderId)

          done()
        })
      })
    })
  })

  describe('Get a connector\'s participant', () => {
    describe('GET /participants/:participant_id', () => {
      before(done => {
        connector = new Connector()
        connector2 = new Connector()
        conversation = new Conversation()
        conversation2 = new Conversation()
        participant = new Participant()
        participant2 = new Participant()
        participant3 = new Participant()

        connector.url = 'http://myurl.com'

        conversation.channel = 'directline'
        conversation.connector = connector._id
        conversation.chatId = 'mychatid'

        participant.senderId = 'part1_senderId'
        participant.data = { name: 'part1' }
        participant.isBot = true
        participant.conversation = conversation._id

        participant2.senderId = 'part2_senderId'
        participant2.data = { name: 'part2' }
        participant2.isBot = false
        participant2.conversation = conversation2._id

        connector2.url = 'http://myurl2.com'

        conversation2.channel = 'directline'
        conversation2.connector = connector2._id
        conversation2.chatId = 'mychatid2'

        participant3.senderId = 'part3_senderId'
        participant3.data = { name: 'part3' }
        participant3.isBot = true
        participant3.conversation = conversation2._id

        connector.save(() => {
          connector2.save(() => {
            conversation.save(() => {
              conversation2.save(() => {
                participant.save(() => {
                  participant2.save(() => {
                    participant3.save(() => {
                      done()
                    })
                  })
                })
              })
            })
          })
        })
      })

      after(done => {
        connector = null
        connector2 = null
        conversation = null
        conversation2 = null
        participant = null
        participant2 = null
        participant3 = null
        Connector.remove(() => {
          Conversation.remove(() => {
            Participant.remove(() => {
              done()
            })
          })
        })
      })

      it('should work with developer_token', (done) => {
        agent.get(`${process.env.ROUTETEST}/v1/connectors/${connector2._id}/participants/${participant3._id}`)
        .send()
        .end((err, result) => {
          should.not.exist(err)
          expect(result.status).to.be(200)
          expect(result.body.results).not.to.be(null)
          expect(result.body.results.id).to.be(participant3._id)
          expect(result.body.results.isBot).to.be(participant3.isBot)
          expect(result.body.results.senderId).to.be(participant3.senderId)

          done()
        })
      })
    })
  })
})
