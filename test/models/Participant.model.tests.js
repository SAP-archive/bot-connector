import chai from 'chai'
import chaiHttp from 'chai-http'
import mongoose from 'mongoose'

import Participant from '../../src/models/Participant.model'

chai.use(chaiHttp)

const assert = require('chai').assert

const fakeParticipant = {
  isBot: false,
  senderId: '1234',
}

function clearDB () {
  for (const i in mongoose.connection.collections) {
    if (mongoose.connection.collections.hasOwnProperty(i)) {
      mongoose.connection.collections[i].remove()
    }
  }
}

describe('Participant Model', () => {
  describe('Create a participant', () => {
    after(async () => clearDB())

    it('can create bot when no one exists', async () => {
      const participant = await new Participant(fakeParticipant).save()

      assert.equal(participant.isBot, fakeParticipant.isBot)
      assert.equal(participant.senderId, fakeParticipant.senderId)
    })
  })

  describe('List participant', () => {
    describe('with no participants', () => {
      after(async () => clearDB())

      it('can list participants', async () => {
        const participants = await Participant.find({}).exec()

        chai.expect(participants.length).to.equal(0)
      })
    })

    describe('with participants', () => {
      before(async () => Promise.all([
        new Participant(fakeParticipant).save(),
        new Participant(fakeParticipant).save(),
      ]))
      after(async () => clearDB())

      it('can index participants', async () => {
        const participants = await Participant.find({}).exec()

        chai.expect(participants.length).to.equal(2)
      })
    })
  })

  describe('Update a participant:', () => {
    describe('with participants', () => {
      let participant = {}
      before(async () => participant = await new Participant(fakeParticipant).save())
      after(async () => clearDB())

      it('can update a participant', async () => {
        const updatedParticipant = await Participant.findOneAndUpdate({ _id: participant._id }, { $set: { isBot: true } }, { new: true })
        assert.equal(updatedParticipant.isBot, true)
      })
    })
  })

  describe('Delete a participant:', () => {
    describe('with participants', () => {
      let participant = {}
      before(async () => participant = await new Participant(fakeParticipant).save())
      after(async () => clearDB())

      it('can remove a specific participant', async () => {
        const deletedParticipants = await Participant.remove({ _id: participant._id })

        assert.equal(deletedParticipants.result.n, 1)
      })
    })
  })
})
