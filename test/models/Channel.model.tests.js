import chai from 'chai'
import chaiHttp from 'chai-http'

import Bot from '../../src/models/Bot.model'
import Channel from '../../src/models/Channel.model'

const assert = require('chai').assert
const expect = chai.expect

chai.use(chaiHttp)

const fakeChannel = {
  type: 'slack',
  isActivated: true,
  slug: 'slug-test1',
  token: '1234567890',
}

describe('Channel Model', () => {
  let bot = {}
  before(async () => bot = await new Bot({ url: 'https://bonjour.com' }))

  describe('Create Channel', () => {
    after(async () => Channel.remove({}))

    it('can create a new Channel', async () => {
      const channel = await new Channel({ bot: bot._id, ...fakeChannel }).save()
      assert.equal(channel.type, fakeChannel.type)
      assert.equal(channel.isActivated, fakeChannel.isActivated)
      assert.equal(channel.slug, fakeChannel.slug)
      assert.equal(channel.token, fakeChannel.token)
    })
  })

  describe('List Channel', () => {
    after(async () => Channel.remove({}))

    it('can list channels when no one exists', async () => {
      const channels = await Channel.find({}).exec()
      expect(channels).to.have.length(0)
    })

    it('can list 1 channel', async () => {
      await new Channel({ bot: bot._id, ...fakeChannel }).save()
      const channels = await Channel.find({}).exec()

      expect(channels).to.have.length(1)
    })
  })

  describe('Update Channel', () => {
    after(async () => Channel.remove({}))

    it('can update 1 channel', async () => {
      const channel = await new Channel({ bot: bot._id, ...fakeChannel }).save()
      const updatedChannel = await Channel.findOneAndUpdate({ _id: channel._id }, { $set: { isActivated: false } }, { new: true }).exec()

      assert.equal(updatedChannel.isActivated, false)
    })
  })

  describe('Delete Channel', () => {
    after(async () => Channel.remove({}))

    it('can remove channel #2', async () => {
      const [channel1] = await Promise.all([
        new Channel({ bot: bot._id, ...fakeChannel }).save(),
        new Channel({ bot: bot._id, ...fakeChannel }).save(),
      ])

      const deletedChannel = await channel1.remove()
      assert.equal(deletedChannel._id, channel1._id)
    })
  })
})
