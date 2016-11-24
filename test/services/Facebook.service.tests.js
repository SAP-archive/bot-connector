import mongoose from 'mongoose'
import chai from 'chai'
import chaiHttp from 'chai-http'

import FacebookService from '../../src/services/Messenger.service'
import {
  invoke,
  invokeSync,
  getWebhookToken,
} from '../../src/utils/index.js'
chai.use(chaiHttp)
const expect = chai.expect
const should = chai.should()

let payload
let res
const opts = {
  senderId:'774961692607582',
  chatId:'913902005381557'}


  describe('FacebookService', () => {

    describe('Suscribe webhook', () => {

      it('should be Ok simple suscribe', async () => {
        const req = {
          query: {}
        }
        const channel = {
          slug: '12345',
          _id: '1231234'
        }

        req.query['hub.mode'] = 'subscribe'
        req.query['hub.verify_token'] =  getWebhookToken(channel._id, channel.slug)

        const res = invokeSync('messenger', 'connectWebhook',[req, channel])
        expect(res).to.equal(true)
      })

      it('should be Ok bad token', async () => {
        const req = {
          query: {}
        }
        const channel = {
          slug: '12345666',
          _id: '12341234',
        }
        req.query['hub.mode'] = 'subscribe'
        req.query['hub.verify_token'] = 'qwerqwerqwer'


        const res = invokeSync('messenger', 'connectWebhook',[req, channel])
        expect(res).to.equal(false)
      })
    })

    xdescribe('Check Security', () => {

      it('should be Ok security check', async () => {
        const req = {
          headers: {
            host: 'a02780b6.ngrok.io',
          }
        }
        req.headers['X-Hub-Signature'] = '1234=1234s'
        const channel = {
          apiKey: '1234',
          webhook: 'https://a02780b6.ngrok.io',
        }
        invoke('messenger', 'checkSecurity',[req, channel]).then(res => {
          ;
        })
      })

    })

    describe('Check all params are valide', () => {

      it('should be Ok all parameter', async () => {
        const channel = {
          apiKey: '1234',
          webhook: 'https://a02780b6.ngrok.io',
          token: 'qrqwerqwerjqkwerfqweiroqwoejqweiruqweprqwnje riqwerhqwpierhquwepriqnweorhuqweprhqnsdfjqpweiryqhsndfkqwuler',
        }
        const res = invokeSync('messenger', 'checkParamsValidity',[channel])
        expect(res).to.equal(true)
      })

      it('should not be OK messing token', async () => {
        const channel = {
          apiKey: '1234',
          webhook: 'https://a02780b6.ngrok.io',
        }
        let err = null
        try{
          const a = invokeSync('messenger', 'checkParamsValidity',[channel])
        } catch(e) { err = e } finally { expect(err).exist }
      })

      it('should not be OK messing webhhok', async () => {
        const channel = {
          apiKey: '1234',
          token: '1234123412341234123412341234123412341234',
        }
        let err = null
        try{
          const a = invokeSync('messenger', 'checkParamsValidity',[channel])
        } catch(e) { err = e } finally { expect(err).exist }
      })

      it('should not be OK messing apiKey', async () => {
        const channel = {
          webhook: '1234',
          token: '1234123412341234123412341234123412341234',
        }
        let err = null
        try{
          const a = invokeSync('messenger', 'checkParamsValidity',[channel])
        } catch(e) { err = e } finally { expect(err).exist }
      })
    })

    describe('Check extaOptions', () => {

      it('should be OK  all option', async () => {
        const req = {
          body: { entry:[{messaging:[{recipient:{id:'12341234'},sender:{id:'sendeid'}}]}]}
        }
        const a = invokeSync('messenger', 'extractOptions',[req])
        expect(a.chatId).to.equal(req.body.entry[0].messaging[0].recipient.id)
        expect(a.senderId).to.equal(req.body.entry[0].messaging[0].sender.id)
      })
    })

    describe('Parsing message', () => {

      it('should be Ok simple text', async () => {
        payload =
        {
          object: 'page',
          entry: [{
            id: '913902005381557',
            time: 1476866470972,
            messaging: [{
              sender: { id: '774961692607582' },
              recipient: { id: '913902005381557' },
              timestamp: 1476866467894,
              message: { mid: 'mid.1476866467894:06f1095d94', seq: 2814, text: 'hello' }
            }]
          }]
        }
        const message = payload.entry[0].messaging[0]
        const res = await invoke('messenger', 'parseChannelMessage',['conversation',payload, {id:'774961692607582',chatId:'913902005381557'}])
        expect(res[2].chatId).to.equal(message.recipient.id)
        expect(res[2].id).to.equal(message.sender.id)
        expect(res[1].attachment.text).to.equal(message.message.text)
      })

      it('should be Ok simple video', async () => {

        payload =
        {
          object: 'page',
          entry: [{
            id: '913902005381557',
            time: 1476866470972,
            messaging: [{
              sender: { id: '774961692607582' },
              recipient: { id: '913902005381557' },
              timestamp: 1476866467894,
              message: { attachment: [{ type: 'video', payload: { url: 'http://www.w3schools.com/css/paris.jpg' } }]
            }
          }]
        }]
      }
      const message = payload.entry[0].messaging[0]
      const res = await invoke('messenger', 'parseChannelMessage',['conversation',payload, {id:'774961692607582',chatId:'913902005381557'}])
      expect(res[2].id).to.equal(message.sender.id)
      expect(res[1].attachment.text).to.equal(message.message.text)
    })

    it('should be Ok simple picture', async () => {
      payload =
      payload =
      {
        object: 'page',
        entry: [{
          id: '913902005381557',
          time: 1476866470972,
          messaging: [{
            sender: { id: '774961692607582' },
            recipient: { id: '913902005381557' },
            timestamp: 1476866467894,
            message: {
              attachment:
              [{ type: 'image',
              payload: { url: 'http://www.w3schools.com/css/paris.jpg' }
            }]
          }
        }]
      }]
    }
    const message = payload.entry[0].messaging[0]
    const res = await invoke('messenger', 'parseChannelMessage',['conversation',payload, {id:'774961692607582',chatId:'913902005381557'}])
    expect(res[2].chatId).to.equal(message.recipient.id)
    expect(res[2].id).to.equal(message.sender.id)
    expect(res[1].attachment.text).to.equal(message.message.text)
  })

  it('should be Ok First text', async () => {
    payload =
    {
      object: 'page',
      entry: [{
        id: '913902005381557',
        time: 1476866470972,
        messaging: [{
          sender: { id: '774961692607582' },
          recipient: { id: '913902005381557' },
          timestamp: 1476866467894,
          postback: { mid: 'mid.1476866467894:06f1095d94', seq: 2814, text: 'hello' }
        }]
      }]
    }
    const message = payload.entry[0].messaging[0]
    const res = await invoke('messenger', 'parseChannelMessage',['conversation',payload, {id:'774961692607582',chatId:'913902005381557'}])
    expect(res[2].chatId).to.equal(message.recipient.id)
    expect(res[2].id).to.equal(message.sender.id)
    expect(res[1].attachment.text).to.equal('start_conversation')
  })
})


describe('Formatting message', () => {
  it('should be Ok simple text', async () => {
    payload = {
      attachment: {
        type: 'text',
        content: 'Yo les loozers',
      },
    }

    const res = await invoke('messenger', 'formatMessage',['conversation',payload, opts])
    expect(res.recipient.id).to.equal(opts.senderId)
    expect(res.message.text).to.equal(payload.attachment.content)
  })

  it('should be Ok picture', async () => {
    payload = {
      attachment: {
        type: 'picture',
        content: 'http://www.w3schools.com/css/paris.jpg',
      },
    }

    const res = await invoke('messenger', 'formatMessage',['conversation',payload, opts])
    expect(res.recipient.id).to.equal(opts.senderId)
    expect(res.message.attachment.type).to.equal('image')
    expect(res.message.attachment.payload.url).to.equal(payload.attachment.content)
  })

  it('should be Ok video', async () => {
    payload = {
      attachment: {
        type: 'video',
        content: 'https://www.youtube.com/watch?v=Ly7uj0JwgKg&list=FLa_5ITc5wcz3ZvbG1aFkWfg&index=51',
      },
    }
    const res = await invoke('messenger', 'formatMessage',['conversation',payload, opts])
    expect(res.recipient.id).to.equal(opts.senderId)
    expect(res.message.attachment.type).to.equal(payload.attachment.type)
    expect(res.message.attachment.payload.url).to.equal(payload.attachment.content)
  })

  it('should be Ok audio', async () => {
    payload = {
      attachment: {
        type: 'audio',
        content: 'https://www.youtube.com/watch?v=Ly7uj0JwgKg&list=FLa_5ITc5wcz3ZvbG1aFkWfg&index=51',
      },
    }
    const res = await invoke('messenger', 'formatMessage',['conversation',payload, opts])
    expect(res.recipient.id).to.equal(opts.senderId)
    expect(res.message.attachment.type).to.equal(payload.attachment.type)
    expect(res.message.attachment.payload.url).to.equal(payload.attachment.content)
  })

  it('should be Ok quickreplies', async () => {
    payload = {
      attachment: {
        type: 'quickReplies',
        content: {
          title: 'i am the title',
          template_type: 'button',
          buttons: [{title:'1', value:'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED', type: 'location'}, {title:'2',value:'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED', type: 'text'}],
        }
      },
    }
    const res = await invoke('messenger', 'formatMessage',['conversation',payload, opts])
    expect(res.recipient.id).to.equal(opts.senderId)
    expect(res.message.quick_replies[0].content_type).to.equal(payload.attachment.content.buttons[0].type)
    expect(res.message.quick_replies[0].title).to.equal(payload.attachment.content.buttons[0].title)
    expect(res.message.quick_replies[0].payload).to.equal(payload.attachment.content.buttons[0].value)
    expect(res.message.quick_replies[1].content_type).to.equal(payload.attachment.content.buttons[1].type)
    expect(res.message.quick_replies[1].title).to.equal(payload.attachment.content.buttons[1].title)
    expect(res.message.quick_replies[1].payload).to.equal(payload.attachment.content.buttons[1].value)

  })

  it('should be Ok card', async () => {

    payload = {
      attachment: {
        type: 'card',
        content: {
          title: 'i am the title',
          subtitle: "Soft white cotton t-shirt is back in style",
          imageUrl: 'https://3.bp.blogspot.com/-W__wiaHUjwI/Vt3Grd8df0I/AAAAAAAAA78/7xqUNj8ujtY/s1600/image02.png',
          itemUrl: 'https://www.google.fr/',
          template_type: 'button',
          buttons: [{title:'2',value:'https://www.google.fr/', type: 'web_url'},{type:'phone_number',title:'bruno',value:"+33675855738"}, {type:'element_share'}],
        }
      },
    }
    const res = await invoke('messenger', 'formatMessage',['conversation',payload, opts])
    expect(res.recipient.id).to.equal(opts.senderId)
    expect(res.message.attachment.type).to.equal('template')
    expect(res.message.attachment.payload.template_type).to.equal('generic')
    expect(res.message.attachment.payload.elements[0].image_url).to.equal(payload.attachment.content.imageUrl)
    expect(res.message.attachment.payload.elements[0].item_url).to.equal(payload.attachment.content.itemUrl)
    expect(res.message.attachment.payload.elements[0].subtitle).to.equal(payload.attachment.content.subtitle)
    expect(res.message.attachment.payload.elements[0].buttons[0].title).to.equal(payload.attachment.content.buttons[0].title)
    expect(res.message.attachment.payload.elements[0].buttons[0].url).to.equal(payload.attachment.content.buttons[0].value)
    expect(res.message.attachment.payload.elements[0].buttons[0].type).to.equal(payload.attachment.content.buttons[0].type)

    expect(res.message.attachment.payload.elements[0].buttons[1].title).to.equal(payload.attachment.content.buttons[1].title)
    expect(res.message.attachment.payload.elements[0].buttons[1].payload).to.equal(payload.attachment.content.buttons[1].value)
    expect(res.message.attachment.payload.elements[0].buttons[1].type).to.equal(payload.attachment.content.buttons[1].type)

    expect(res.message.attachment.payload.elements[0].buttons[2].title).to.equal(payload.attachment.content.buttons[2].title)
  })
})
})
