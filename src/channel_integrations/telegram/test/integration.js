import chai from 'chai'
import { setupChannelIntegrationTests } from '../../../../test/tools'
import nock from 'nock'
import _ from 'lodash'

/* eslint max-nested-callbacks: 0 */  // --> OFF

const expect = chai.expect
const should = chai.should()

const channelCreationParams = {
  type: 'telegram',
  slug: 'my-awesome-channel',
  token: 'token',
}

describe('Telegram channel', () => {

  const { createChannel, updateChannel, deleteChannel,
    sendMessageToWebhook } = setupChannelIntegrationTests()
  const telegramAPI = 'https://api.telegram.org'

  beforeEach(() => {
    nock(telegramAPI).post('/bottoken/setWebhook').query(true).reply(200, {})
  })

  describe('Creation', () => {
    it('should be successful with valid parameters', async () => {
      const response = await createChannel(channelCreationParams)
      const { results: result, message } = response.body

      expect(response.status).to.equal(201)
      expect(message).to.equal('Channel successfully created')
      expect(result.type).to.equal(channelCreationParams.type)
      expect(result.slug).to.equal(channelCreationParams.slug)
      /* eslint no-unused-expressions: 0 */  // --> OFF
      expect(result.isErrored).to.be.false
      expect(result.isActivated).to.be.true
    })
    it('should return 400 with invalid parameters', async () => {
      try {
        await createChannel({})
        should.fail()
      } catch (error) {
        expect(error.status).to.equal(400)
      }
    })
  })

  describe('Update', () => {
    it('should be successful if channel exists', async () => {
      let response = await createChannel(channelCreationParams)
      const channel = response.body.results
      const newValues = JSON.parse(JSON.stringify(channelCreationParams))
      newValues.token = 'newtoken'
      nock(telegramAPI).post('/botnewtoken/setWebhook').query(true).reply(200, {})
      nock(telegramAPI).get('/bottoken/deleteWebhook').query(true).reply(200, {})
      response = await updateChannel(channel, newValues)
      expect(response.status).to.equal(200)
      expect(response.body.results.token).to.equal(newValues.token)
    })
  })

  describe('Deletion', () => {
    it('should be successful if channel exists', async () => {
      let response = await createChannel(channelCreationParams)
      const channel = response.body.results
      nock(telegramAPI).get('/bottoken/deleteWebhook').query(true).reply(200, {})
      response = await deleteChannel(channel)
      expect(response.status).to.equal(200)
    })
  })

  describe('sending a message', () => {

    let channel

    beforeEach(async () => {
      channel = (await createChannel(channelCreationParams)).body.results
    })

    it('should be successful with valid parameters', async () => {
      const outgoingMessageCall = nock(telegramAPI).post('/bottoken/sendMessage').reply(200, {})
      const response = await sendMessageToWebhook(channel, {
        message: { chat: { id: 123 }, text: 'a message' },
      })
      expect(response.status).to.equal(200)
      expect(response.body).to.eql({ status: 'success' })
      expect(outgoingMessageCall.isDone()).to.be.true
    })

    describe('should be successful', () => {

      const body = {
        message: { chat: { id: 123 }, text: 'a message' },
      }
      const headers = {}

      it('in list format', async () => {
        nock(telegramAPI).post('/bottoken/sendMessage').reply(200, {})
        const buttons = [
          { type: 'account_link', title: 'button title', value: 'https://link.com' },
          { type: 'web_url', title: 'button title', value: 'https://link.com' },
          { type: 'phone_number', title: 'button title', value: '0123554' }]
        const listElement = {
          title: 'title',
          subtitle: 'subtitle',
          imageUrl: 'https://img.url',
          buttons,
        }
        const expectedBody = _.matches({
          chat_id: `${body.message.chat.id}`,
          parse_mode: 'Markdown',
          text: `*- ${listElement.title}*\n${listElement.subtitle}\n${listElement.imageUrl}`,
        })
        const apiCall = nock(telegramAPI).post('/bottoken/sendMessage', expectedBody).reply(200, {})
        const botResponse = {
          results: {},
          messages: JSON.stringify([{
            type: 'list',
            content: { elements: [listElement], buttons },
          }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
        expect(apiCall.isDone()).to.be.true
      })

      it('in card format', async () => {
        const cardElement = {
          title: 'title',
          subtitle: 'subtitle',
          imageUrl: 'https://img.url',
          buttons: [{ type: '', title: 'button title', value: 'abc' }],
        }
        const expectedPhotoBody = _.matches({
          chat_id: `${body.message.chat.id}`,
          photo: cardElement.imageUrl,
        })
        const photoRequest = nock(telegramAPI)
          .post('/bottoken/sendPhoto', expectedPhotoBody).reply(200, {})
        const expectedMessageBody = _.matches({
          chat_id: `${body.message.chat.id}`,
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{
              text: cardElement.buttons[0].title,
              callback_data: cardElement.buttons[0].value,
            }]],
            one_time_keyboard: true,
          },
          text: `*${cardElement.title}*\n**${cardElement.subtitle}**`,
        })
        const messageRequest = nock(telegramAPI)
          .post('/bottoken/sendMessage', expectedMessageBody).reply(200, {})
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'card', content: cardElement }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
        expect(photoRequest.isDone()).to.be.true
        expect(messageRequest.isDone()).to.be.true
      })

      it('in carousel format', async () => {
        const carouselElement = {
          title: 'title',
          imageUrl: 'https://img.url',
          buttons: [{ type: '', title: 'button title', value: 'abc' }],
        }
        const expectedMessageBody = _.matches({
          chat_id: `${body.message.chat.id}`,
          parse_mode: 'Markdown',
          text: `*${carouselElement.title}*\n[](${carouselElement.imageUrl})`,
        })
        const keyboardBody = _.matches({
          chat_id: `${body.message.chat.id}`,
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{
              text: carouselElement.buttons[0].title,
              callback_data: carouselElement.buttons[0].value,
            }]],
            one_time_keyboard: true,
          },
          text: `*${carouselElement.title}*\n[](${carouselElement.imageUrl})`,
        })

        const keyboardRequest = nock(telegramAPI)
          .post('/bottoken/sendMessage', keyboardBody).reply(200, {})
        const messageRequest = nock(telegramAPI)
          .post('/bottoken/sendMessage', expectedMessageBody).reply(200, {})
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'carousel', content: [carouselElement] }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
        expect(messageRequest.isDone()).to.be.true
        expect(keyboardRequest.isDone()).to.be.true
      })

      it('in quickReplies format', async () => {
        const buttonsElement = {
          title: 'title',
          buttons: [{ type: '', title: 'button title', value: 'abc' }],
        }
        const expectedMessageBody = _.matches({
          chat_id: `${body.message.chat.id}`,
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [[{
              text: buttonsElement.buttons[0].title,
              callback_data: buttonsElement.buttons[0].value,
            }]],
            one_time_keyboard: true,
          },
          text: `*${buttonsElement.title}*\n****`,
        })
        const messageRequest = nock(telegramAPI)
          .post('/bottoken/sendMessage', expectedMessageBody).reply(200, {})
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'quickReplies', content: buttonsElement }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
        expect(messageRequest.isDone()).to.be.true
      })

      it('in video format', async () => {
        const videoLink = 'https://link.com'
        const expectedVideoBody = _.matches({
          chat_id: `${body.message.chat.id}`,
          reply_markup: { one_time_keyboard: true },
          video: videoLink,
        })
        const videoRequest = nock(telegramAPI)
          .post('/bottoken/sendVideo', expectedVideoBody).reply(200, {})
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'video', content: videoLink }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
        expect(videoRequest.isDone()).to.be.true
      })

      it('in picture format', async () => {
        const pictureLink = 'https://link.com'
        const expectedPictureBody = _.matches({
          chat_id: `${body.message.chat.id}`,
          reply_markup: { one_time_keyboard: true },
          photo: pictureLink,
        })
        const pictureRequest = nock(telegramAPI)
          .post('/bottoken/sendPhoto', expectedPictureBody).reply(200, {})
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'picture', content: pictureLink }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
        expect(pictureRequest.isDone()).to.be.true
      })

      it('in picture format - failing', async () => {
        const pictureLink = 'https://link.com'
        const expectedPictureBody = _.matches({
          chat_id: `${body.message.chat.id}`,
          reply_markup: { one_time_keyboard: true },
          photo: pictureLink,
        })
        const pictureRequest = nock(telegramAPI)
          .post('/bottoken/sendPhoto', expectedPictureBody)
          .reply(403, {
            ok: false,
            error_code: 403,
            description: 'Forbidden: bot was blocked by the user',
          })
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'picture', content: pictureLink }]),
        }
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
        expect(pictureRequest.isDone()).to.be.true
      })

      it('in buttons format', async () => {
        const buttonsElement = {
          title: 'title',
          buttons: [{ type: '', title: 'button title', value: 'abc' }],
        }
        const botResponse = {
          results: {},
          messages: JSON.stringify([{ type: 'buttons', content: buttonsElement }]),
        }
        const expectedMessageBody = _.matches({
          chat_id: `${body.message.chat.id}`,
          reply_markup: {
            keyboard: [[{
              text: buttonsElement.buttons[0].title,
              callback_data: buttonsElement.buttons[0].value,
            }]],
            one_time_keyboard: true,
          },
          text: buttonsElement.title,
        })
        const messageRequest = nock(telegramAPI)
          .post('/bottoken/sendMessage', expectedMessageBody).reply(200, {})
        const response = await sendMessageToWebhook(channel, body, headers, botResponse)
        expect(response.status).to.equal(200)
        expect(messageRequest.isDone()).to.be.true
      })
    })

  })
})
