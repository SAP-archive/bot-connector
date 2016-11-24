import chai from 'chai'
import chaiHttp from 'chai-http'
import mongoose from 'mongoose'

import Bot from '../../src/models/Bot.model'

const assert = require('chai').assert
const expect = chai.expect

chai.use(chaiHttp)

const fakeBot = { url: 'https://recast.ai' }
const fakeId = '57fe26383750e0379bee8aca'

function clearDB () {
  for (const i in mongoose.connection.collections) {
    if (mongoose.connection.collections.hasOwnProperty(i)) {
      mongoose.connection.collections[i].remove()
    }
  }
}

describe('Bot Model', () => {
  describe('Create bot', () => {
    describe('Create a bot when db is empty:', () => {
      after(async () => clearDB())

      it('can create bot when no one exists', async () => {
        const bot = await new Bot({ url: fakeBot.url }).save()
        assert.equal(bot.url, fakeBot.url)
      })
    })

    describe('Create a bot when db have a bot', () => {
      before(async () => new Bot({ url: fakeBot.url }).save())
      after(async () => clearDB())

      it('can create bot when one exists', async () => {
        const bot = await new Bot({ url: fakeBot.url }).save()
        assert.equal(bot.url, fakeBot.url)
      })
    })
  })

  describe('List bot', () => {
    describe('List bot when no one exist', () => {
      after(async () => clearDB())

      it('can list bot when no one exists', async () => {
        const bots = await Bot.find({}).exec()
        expect(bots).to.have.length(0)
      })
    })

    describe('List bots when two exist', () => {
      before(async () => Promise.all([
        new Bot({ url: 'https://hello.com' }).save(),
        new Bot({ url: 'https://bye.com' }).save(),
      ]))
      after(async () => clearDB())

      it('can list bots when two exists', async () => {
        const bots = await Bot.find({})
        expect(bots).to.have.length(2)
      })
    })
  })

  describe('Update bot', () => {
    describe('can update bot when one bot exist', () => {
      let bot = {}
      before(async () => bot = await new Bot({ url: fakeBot.url }).save())
      after(async () => clearDB())

      it('can updated bots when one bot exists', async () => {
        const updatedBot = await Bot.findOneAndUpdate({ _id: bot._id }, { $set: { url: 'https://updated.com' } }, { new: true }).exec()
        assert.equal(updatedBot.url, 'https://updated.com')
      })
    })
  })

  describe('Delete bot', () => {
    describe('can delete bot when no bot exist', () => {
      after(async () => clearDB())

      it('can delete bot when id not found', async () => {
        const deletedBots = await Bot.remove({ _id: fakeId })
        assert.equal(deletedBots.result.n, 0)
      })
    })

    describe('can delete bot when one bot exist', () => {
      let bot = {}
      before(async () => bot = await new Bot({ url: fakeBot.url }).save())
      after(async () => clearDB())

      it('can delete bot when one exists', async () => {
        const deletedBots = await Bot.remove({ _id: bot._id })
        assert.equal(deletedBots.result.n, 1)
      })
    })
  })

})
