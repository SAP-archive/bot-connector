import mongoose from 'mongoose'
import chai from 'chai'
import chaiHttp from 'chai-http'

import KikService from '../../src/services/Kik.service'

import {
  invoke,
  invokeSync,
} from '../../src/utils/index.js'

chai.use(chaiHttp)
const expect = chai.expect
const should = chai.should()

const opts = {
  senderId:'774961692607582',
  chatId:'913902005381557'}


  let payload
  let res

describe('KikService', () => {

 describe('check checkSecurity', () => {

   it('should be Ok security check', async () => {
     const req = {
       headers: {
         host: 'a02780b6.ngrok.io',
       }
     }
     req.headers['x-kik-username'] = 'mybot'
     const channel = {
       userName: 'mybot',
       webhook: 'https://a02780b6.ngrok.io',
     }
     const res = invokeSync('kik', 'checkSecurity',[req, channel])
       expect(res).to.equal(true)
   })

   it('should not be Ok security check', async () => {
     const req = {
       headers: {
         host: 'a02780b6.ngrok.io',
       }
     }
     req.headers['x-kik-username'] = 'qwer'
     const channel = {
       userName: 'mybot',
       webhook: 'https://a02780b6.ngrok.io',
     }
     const res = invokeSync('kik', 'checkSecurity',[req, channel])
       expect(res).to.equal(false)
   })

 })

 describe('Check all params are valide', () => {
       it('should be Ok all parameter', async () => {
         const channel = {
           apiKey: '1234',
           webhook: 'https://a02780b6.ngrok.io',
           userName: 'user name',
         }
         invoke('kik', 'checkParamsValidity',[channel]).then(res => {
           expect(res).to.equal(true)
         })
       })
       it('should not be OK messing userName', async () => {
         const channel = {
           apiKey: '1234',
           webhook: 'https://a02780b6.ngrok.io',
         }
         let err = null
         try{
           const a = invokeSync('kik', 'checkParamsValidity',[channel])
         } catch(e) { err = e } finally { expect(err).exist }
       })
       it('should not be OK messing webhhok', async () => {
         const channel = {
           apiKey: '1234',
           userName: 'user name',
         }
         let err = null
         try{
           const a = invokeSync('kik', 'checkParamsValidity',[channel])
         } catch(e) { err = e } finally { expect(err).exist }
       })
       it('should not be OK messing apiKey', async () => {
         const channel = {
           webhook: '1234',
           userName: 'user name',
         }
         let err = null
         try{
           const a = invokeSync('kik', 'checkParamsValidity',[channel])
         } catch(e) { err = e } finally { expect(err).exist }
       })
     })

     describe('Check extaOptions', () => {
   it('should be OK  all option', async () => {
       const req = {
         body: {messages:[{chatId: '12341234', participants:['recast.ai']}]}
        }
        const a = invokeSync('kik', 'extractOptions',[req])
        expect(a.chatId).to.equal(req.body.messages[0].chatId)
        expect(a.senderId).to.equal(req.body.messages[0].participants[0])
     })
   })

    describe('Parsing message', () => {
      it('should be Ok simple text', async ()=> {
        payload = {
          messages: [
            {
              chatId: "0ee6d46753bfa6ac2f089149959363f3f59ae62b10cba89cc426490ce38ea92d",
              id: "0115efde-e54b-43d5-873a-5fef7adc69fd",
              type: "text",
              from: "laura",
              participants: ["laura"],
              body: "omg r u real?",
              timestamp: 1439576628405,
              readReceiptRequested: true,
              mention: null
            }
          ]
        }
        const res = await invoke('kik', 'parseChannelMessage',['conversation', payload, opts])
          expect(res[2].chatId).to.equal(opts.chatId)
          expect(res[2].senderId).to.equal(opts.senderId)
          expect(res[1].attachment.value).to.equal(payload.messages[0].body)
      })

      it('should be default when bad parameter', async ()=> {
        payload = {
          messages: [
            {
              chatId: "0ee6d46753bfa6ac2f089149959363f3f59ae62b10cba89cc426490ce38ea92d",
              id: "0115efde-e54b-43d5-873a-5fef7adc69fd",
              type: "dblablalbl",
              from: "laura",
              participants: ["laura"],
              body: "omg r u real?",
              timestamp: 1439576628405,
              readReceiptRequested: true,
              mention: null
            }
          ]
        }
        const res = await invoke('kik', 'parseChannelMessage',['conversation', payload, opts])
          expect(res[2].chatId).to.equal(opts.chatId)
          expect(res[2].senderId).to.equal(opts.senderId)
          expect(res[1].attachment.value).to.equal('we don\'t handle this type')
      })

      it('should be Ok video', async() => {
        payload = {
          messages: [
            {
              chatId: "b3be3bc15dbe59931666c06290abd944aaa769bb2ecaaf859bfb65678880afab",
              type: "video",
              from: "laura",
              participants: ["laura"],
              id: "6d8d060c-3ae4-46fc-bb18-6e7ba3182c0f",
              timestamp: 1399303478832,
              readReceiptRequested: true,
              videoUrl: "http://example.kik.com/video.mp4",
              mention: null
            }
          ]
        }
        const res = await invoke('kik', 'parseChannelMessage',['conversation', payload, opts])
          expect(res[2].chatId).to.equal(opts.chatId)
          expect(res[2].senderId).to.equal(opts.senderId)
          expect(res[1].attachment.value).to.equal(payload.messages[0].videoUrl)
      })

      it('should be Ok picture', async() => {
        payload = {
          messages: [
            {
              chatId: "b3be3bc15dbe59931666c06290abd944aaa769bb2ecaaf859bfb65678880afab",
              type: "picture",
              from: "laura",
              participants: ["laura"],
              id: "6d8d060c-3ae4-46fc-bb18-6e7ba3182c0f",
              picUrl: "http://example.kik.com/apicture.jpg",
              timestamp: 1399303478832,
              readReceiptRequested: true,
              mention: null
            }
          ]
        }
        const res = await invoke('kik', 'parseChannelMessage',['conversation', payload, opts])
          expect(res[2].chatId).to.equal(opts.chatId)
          expect(res[2].senderId).to.equal(opts.senderId)
          expect(res[1].attachment.value).to.equal(payload.messages[0].picUrl)
      })

      it('should be Ok link', async() => {
        payload = {
          messages: [
            {
              chatId: "b3be3bc15dbe59931666c06290abd944aaa769bb2ecaaf859bfb65678880afab",
              type: "link",
              from: "laura",
              participants: ["laura"],
              id: "6d8d060c-3ae4-46fc-bb18-6e7ba3182c0f",
              timestamp: 83294238952,
              url: "http://mywebpage.com",
              noForward: true,
              readReceiptRequested: true,
              mention: null
            }
          ]
        }
        const res = await invoke('kik', 'parseChannelMessage',['conversation', payload, opts])
          expect(res[2].chatId).to.equal(opts.chatId)
          expect(res[2].senderId).to.equal(opts.senderId)
          expect(res[1].attachment.value).to.equal(payload.messages[0].url)
      })

      describe('Formatting message', () => {
        it('should be Ok simple text', async() => {
          payload = {
            attachment: {
              type: 'text',
              content: 'Yo les loozers',
            },
          }
          const res = invokeSync('kik', 'formatMessage',['conversation', payload, opts])
          expect(res[0].chatId).to.equal(opts.chatId)
          expect(res[0].to).to.equal(opts.senderId)
          expect(res[0].type).to.equal(payload.attachment.type)
          expect(res[0].body).to.equal(payload.attachment.content)
        })

        it('should be defaul whit wrong parmetter', async() => {
          payload = {
            attachment: {
              type: 'qqwerreww',
              content: 'Yo les loozers',
            },
          }
          const res = invokeSync('kik', 'formatMessage',['conversation', payload, opts])
          expect(res[0].chatId).to.equal(opts.chatId)
          expect(res[0].to).to.equal(opts.senderId)
          expect(res[0].type).to.equal('text')
          expect(res[0].body).to.equal('wrong parameter')
        })


        it('should be Ok picture', async () => {
          payload = {
            attachment: {
              type: 'picture',
              value: 'picurl',
            }
          }
          const res = invokeSync('kik', 'formatMessage',['conversation', payload, opts])
          expect(res[0].chatId).to.equal(opts.chatId)
          expect(res[0].to).to.equal(opts.senderId)
          expect(res[0].type).to.equal(payload.attachment.type)
          expect(res[0].body).to.equal(payload.attachment.content)
        })

        it('should be Ok video', async() => {
          payload =  {
            attachment: {
              type: 'video',
              value: 'videourl',
            },
          }
          const res = invokeSync('kik', 'formatMessage',['conversation', payload, opts])
          expect(res[0].chatId).to.equal(opts.chatId)
          expect(res[0].to).to.equal(opts.senderId)
          expect(res[0].type).to.equal(payload.attachment.type)
          expect(res[0].body).to.equal(payload.attachment.content)
        })

        it('should be Ok quickreplies', async() => {
          payload = {
            attachment:
            {
              type: 'quickReplies',
              content: {
                title: 'i am the title',
                buttons: [{title:'1', value:'1'}, {title:'2',value:'2'},{title:'2',value:'2'},{title:'2',value:'2'},],
              }
            },
          }
          const res = invokeSync('kik', 'formatMessage',['conversation', payload, opts])
          expect(res[0].chatId).to.equal(opts.chatId)
          expect(res[0].to).to.equal(opts.senderId)
          expect(res[0].type).to.equal('text')
          expect(res[0].body).to.equal(payload.attachment.content.title)
          expect(res[0].keyboards[0].type).to.equal('suggested')
          expect(res[0].keyboards[0].responses[0].type).to.equal('text')
          expect(res[0].keyboards[0].responses[0].body).to.equal(payload.attachment.content.buttons[0].value)
          expect(res[0].keyboards[0].responses[1].type).to.equal('text')
          expect(res[0].keyboards[0].responses[1].body).to.equal(payload.attachment.content.buttons[1].value)
          expect(res[0].keyboards[0].responses[2].type).to.equal('text')
          expect(res[0].keyboards[0].responses[2].body).to.equal(payload.attachment.content.buttons[2].value)
          expect(res[0].keyboards[0].responses[3].type).to.equal('text')
          expect(res[0].keyboards[0].responses[3].body).to.equal(payload.attachment.content.buttons[3].value)
        })

        it('should be Ok card', async() => {
          payload = {
            attachment: {
              type: 'card',
              content: {
                title: 'hello',
                imageUrl: 'imageUrl',
                buttons: [{type: 'text', title:'hello'}],
              },
            },
          }

          const res = invokeSync('kik', 'formatMessage',['conversation', payload, opts])
          expect(res[0].chatId).to.equal(opts.chatId)
          expect(res[0].to).to.equal(opts.senderId)
          expect(res[0].type).to.equal('text')
          expect(res[0].body).to.equal(payload.attachment.content.title)

          expect(res[1].type).to.equal('picture')
          expect(res[1].picUrl).to.equal(payload.attachment.content.imageUrl)

          expect(res[1].keyboards[0].type).to.equal('suggested')
          expect(res[1].keyboards[0].type).to.equal('suggested')
          expect(res[1].keyboards[0].responses[0].type).to.equal('text')
          expect(res[1].keyboards[0].responses[0].body).to.equal(payload.attachment.content.buttons[0].title)
        })
      })
    })
  })
