import chai from 'chai'
import sinon from 'sinon'
import { RtmClient } from '@slack/client'
import request from 'superagent'

import Bot from '../../src/models/Bot.model'
import Channel from '../../src/models/Channel.model'
import Conversation from '../../src/models/Conversation.model'
import SlackService from '../../src/services/Slack.service'
import Logger from '../../src/utils/Logger'

const expect = chai.expect

let bot
let activeChannel
let inactiveChannel

const url = 'http://localhost:8080'
const getChannelInfo = (slug, isActivated, bot) => {
  return {
    type: 'slack',
    token: 'slack-token',
    isActivated,
    slug,
    bot: bot._id,
  }
}

const textSlackMessage = {
  text: 'Hello you!'
}

const imageSlackMessage = {
  file: {
    mimetype: 'image/jpg',
    url_private: 'some_image_url',
  }
}

const videoSlackMessage = {
  file: {
    mimetype: 'video/mp4',
    url_private: 'some_video_url',
  }
}

const invalidSlackMessage = {
  file: {
    mimetype: 'application/json',
  }
}

const connectorTextMessage = {
  attachment: {
    type: 'text',
    content: 'Hello you!'
  }
}

const connectorImageMessage = {
  attachment: {
    type: 'picture',
    content: 'some_image_url'
  }
}

const connectorVideoMessage = {
  attachment: {
    type: 'video',
    content: 'some_video_url'
  }
}

const connectorCardMessage = {
  attachment: {
    type: 'card',
    content: {
      title: 'A nice card',
      imageUrl: 'some_image_url',
      buttons: [{
        title: 'First button',
        type: 'button',
        value: 'First!',
      }]
    }
  }
}

const connectorQuickRepliesMessage = {
  attachment: {
    type: 'quickReplies',
    content: {
      title: 'A nice card',
      buttons: [{
        title: 'First button',
        value: 'First!',
      }]
    }
  }
}

const invalidConnectorMessage = {
  attachment: {
    type: 'invalid_type',
  },
}


describe('Slack service', () => {
  before(async () => {
    bot = await new Bot({ url, }).save()
    await new Channel(getChannelInfo('slack-1', true, bot)).save()
    activeChannel = await new Channel(getChannelInfo('slack-2', true, bot)).save()
    inactiveChannel = await new Channel(getChannelInfo('slack-3', false, bot)).save()
    await new Channel({ type: 'kik', isActivated: true, slug: 'kik-1', token: 'token-kik', bot: bot._id }).save()
  })

  after(async () => {
    await Bot.remove({})
    await Channel.remove({})
  })

  describe('checkParamsValidity', async () => {
    it('should throw if not token is set', async () => {
      const channel = await new Channel({ type: 'slack', slug: 'slug', isActivated: true , bot}).save()
      let err = null

      try {
        SlackService.checkParamsValidity(channel)
      } catch (ex) {
        err = ex
      }
      expect(err).not.to.equal(null)

      channel.token = 'token'
      await channel.save()
      err = null
      let res = null
      try {
        res = SlackService.checkParamsValidity(channel)
      } catch (ex) {
        err = ex
      }
      expect(err).to.equal(null)
      expect(res).to.equal(true)
      await channel.remove()
    })

    describe('onLaunch', async () => {
      it('should call onChannelCreate for each slack channels', async () => {
        const stub = sinon.stub(SlackService, 'onChannelCreate', () => { true })
        await SlackService.onLaunch()
        expect(SlackService.onChannelCreate.callCount).to.equal(3)
        stub.restore()
      })

      it('should log and resolve on error', async () => {
        sinon.spy(Logger, 'error')
        const stub = sinon.stub(SlackService, 'onChannelCreate', () => {
          throw new Error('error !')
        })

        await SlackService.onLaunch()
        expect(Logger.error.calledOnce)
        stub.restore()
        Logger.error.restore()
      })
    })

    describe('onChannelCreate', async () => {
      it('should return early is channel is not active', async () => {
        sinon.spy(RtmClient, 'constructor')
        SlackService.onChannelCreate(inactiveChannel)
        expect(RtmClient.constructor.calledOnce).to.equal(false)
        RtmClient.constructor.restore()
      })

      it('should start rtm connection if  channel is active', async () => {
        const startStub = sinon.stub(RtmClient.prototype, 'start', () => { true })
        const onStub = sinon.stub(RtmClient.prototype, 'on', () => { true })
        SlackService.onChannelCreate(activeChannel)
        expect(RtmClient.constructor.calledOnce)
        expect(RtmClient.prototype.on.calledOnce)
        expect(RtmClient.prototype.start.calledOnce)
        startStub.restore()
        onStub.restore()
      })

      it('set rtm client in allRtm map', async () => {
        const startStub = sinon.stub(RtmClient.prototype, 'start', () => { true })
        const onStub = sinon.stub(RtmClient.prototype, 'on', () => { true })
        SlackService.allRtm = new Map()
        SlackService.onChannelCreate(activeChannel)

        expect(RtmClient.constructor.calledOnce)
        expect(RtmClient.prototype.on.calledOnce)
        expect(RtmClient.prototype.start.calledOnce)

        expect(SlackService.allRtm.get(activeChannel._id.toString())).to.exist

        startStub.restore()
        onStub.restore()
      })
    })

    describe('onChannelDelete', async () => {
      it('should close rtm connection and remove channel from allRtm', async () => {
        const startStub = sinon.stub(RtmClient.prototype, 'start', () => { true })
        const onStub = sinon.stub(RtmClient.prototype, 'on', () => { true })
        const disconnectStub = sinon.stub(RtmClient.prototype, 'disconnect', () => { true })
        SlackService.allRtm = new Map()
        SlackService.onChannelCreate(activeChannel)

        expect(RtmClient.constructor.calledOnce)
        expect(RtmClient.prototype.on.calledOnce)
        expect(RtmClient.prototype.start.calledOnce)
        expect(SlackService.allRtm.get(activeChannel._id.toString())).to.exist

        SlackService.onChannelDelete(activeChannel)
        expect(RtmClient.prototype.disconnect.calledOnce)
        expect(SlackService.allRtm.get(activeChannel._id.toString())).not.to.exist

        startStub.restore()
        onStub.restore()
        disconnectStub.restore()
      })

      it('should do nothing is rtm connection is not active', async () => {
        const disconnectStub = sinon.stub(RtmClient.prototype, 'disconnect', () => { true })
        SlackService.allRtm = new Map()

        SlackService.onChannelDelete(activeChannel)
        expect(RtmClient.prototype.disconnect.calledOnce).to.equal(false)

        disconnectStub.restore()
      })
    })

    describe('onChannelUpdate', async () => {
      it('should call onDelete and onCreate', async () => {
        const deleteStub = sinon.stub(SlackService, 'onChannelDelete', () => { true })
        const createStub = sinon.stub(SlackService, 'onChannelCreate', () => { Promise.resolve(true) })
        SlackService.onChannelUpdate(activeChannel)
        expect(deleteStub.calledOnce)
        deleteStub.restore()
        expect(createStub.calledOnce)
        createStub.restore()
      })
    })

    describe('parseChannelMessage', async () => {
      it('should parse text message correctly', async () => {
        const conv = {}, opts = {} // This methd doesnt use conversation nor opts

        const [c, parsedMessage, opt] = await SlackService.parseChannelMessage(conv, textSlackMessage, opts)
        expect(parsedMessage.channelType).to.equal('slack')
        expect(parsedMessage.attachment.type).to.equal('text')
        expect(parsedMessage.attachment.content).to.equal('Hello you!')
      })

      it('should parse image message correctly', async () => {
        const conv = {}, opts = {} // This methd doesnt use conversation nor opts

        const [c, parsedMessage, opt] = await SlackService.parseChannelMessage(conv, imageSlackMessage, opts)
        expect(parsedMessage.channelType).to.equal('slack')
        expect(parsedMessage.attachment.type).to.equal('picture')
        expect(parsedMessage.attachment.content).to.equal('some_image_url')
      })

      it('should parse video message correctly', async () => {
        const conv = {}, opts = {} // This methd doesnt use conversation nor opts

        const [c, parsedMessage, opt] = await SlackService.parseChannelMessage(conv, videoSlackMessage, opts)
        expect(parsedMessage.channelType).to.equal('slack')
        expect(parsedMessage.attachment.type).to.equal('picture')
        expect(parsedMessage.attachment.content).to.equal('some_video_url')
      })

      it('should throw error on other mimetype', async () => {
        const conv = {}, opts = {} // This methd doesnt use conversation nor opts

        let err = null
        try {
          const [c, parsedMessage, opt] = await SlackService.parseChannelMessage(conv, invalidSlackMessage, opts)
        } catch (ex) {
          err = ex
        }
        expect(err).to.exist
        expect(err.message).to.equal('Sorry but we don\'t handle such type of file')
      })
    })

    describe('parseMessage', async () => {
      it('should format text messages correctly', () => {
        const formattedMessage = SlackService.formatMessage({}, connectorTextMessage)
        expect(formattedMessage.text).to.equal(connectorTextMessage.attachment.content)
      })

      it('should format image messages correctly', () => {
        const formattedMessage = SlackService.formatMessage({}, connectorImageMessage)
        expect(formattedMessage.text).to.equal(connectorImageMessage.attachment.content)
      })

      it('should format video messages correctly', () => {
        const formattedMessage = SlackService.formatMessage({}, connectorVideoMessage)
        expect(formattedMessage.text).to.equal(connectorVideoMessage.attachment.content)
      })

      it('should format card messages correctly', () => {
        const formattedMessage = SlackService.formatMessage({}, connectorCardMessage)
        const attach = formattedMessage.attachments[0]
        expect(attach.fallback).to.equal('Sorry but I can\'t display buttons')
        expect(attach.attachment_type).to.equal('default')

        expect(attach.actions[0].name).to.equal('First button')
        expect(attach.actions[0].text).to.equal('First button')
        expect(attach.actions[0].value).to.equal('First!')
        expect(attach.actions[0].type).to.equal('button')
      })

      it('should format quickReplies messages correctly', () => {
        const formattedMessage = SlackService.formatMessage({}, connectorQuickRepliesMessage)
        const attach = formattedMessage.attachments[0]
        expect(attach.fallback).to.equal('Sorry but I can\'t display buttons')
        expect(attach.attachment_type).to.equal('default')

        expect(attach.actions[0].name).to.equal('First button')
        expect(attach.actions[0].text).to.equal('First button')
        expect(attach.actions[0].value).to.equal('First!')
        expect(attach.actions[0].type).to.equal('button')
      })

      it('should throw with invalid message type', () => {
        let err = null

        try {
          SlackService.formatMessage({}, invalidConnectorMessage)
        } catch (ex) {
          err = ex
        }

        expect(err).to.exist
        expect(err.message).to.equal('Invalid message type')
      })
    })

    describe('sendMessage', async () => {
      it('should make request to slack', async () => {
        const formattedMessage = SlackService.formatMessage({}, connectorCardMessage)
        const channel = activeChannel
        const convers = await new Conversation({ chatId: 'chatId', channel: channel._id, bot: bot }).save()
        convers.channel = channel
        await convers.save()

        const expectedParams = `https://slack.com/api/chat.postMessage?token=${channel.token}&channel=${convers.chatId}&as_user=true&text=${formattedMessage.text}&attachments=${JSON.stringify(formattedMessage.attachments)}`

        const requestStub = sinon.stub(request, 'post', (url) => {
          expect(url).to.equal(expectedParams)
          // Fake superagent end method
          return { end: (cb) => cb(null) }
        })

        const res = await SlackService.sendMessage(convers, formattedMessage)

        expect(res).to.equal('Message sent')
        expect(requestStub.calledWith(expectedParams))

        requestStub.restore()
      })

      it('should log and throw on error', async () => {
        const formattedMessage = SlackService.formatMessage({}, connectorCardMessage)
        const channel = activeChannel
        const convers = await new Conversation({ chatId: 'chatId', channel: channel._id, bot: bot }).save()
        convers.channel = channel
        await convers.save()

        const expectedParams = `https://slack.com/api/chat.postMessage?token=${channel.token}&channel=${convers.chatId}&as_user=true&text=${formattedMessage.text}&attachments=${JSON.stringify(formattedMessage.attachments)}`

        const loggerStub = sinon.stub(Logger, 'error')
        const requestStub = sinon.stub(request, 'post', (url) => {
          expect(url).to.equal(expectedParams)
          // Fake superagent end method
          return { end: (cb) => cb(new Error('Fake error')) }
        })

        let err = null
        try {
          const res = await SlackService.sendMessage(convers, formattedMessage)
        } catch (ex) {
          err = ex
        }

        expect(err).exist
        expect(requestStub.calledWith(expectedParams))
        expect(loggerStub.calledOnce)

        requestStub.restore()
        loggerStub.restore()
      })
    })
  })
})
