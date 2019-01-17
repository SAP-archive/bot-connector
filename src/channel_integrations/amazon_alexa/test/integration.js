import chai from 'chai'
import { setupChannelIntegrationTests } from '../../../../test/tools'
import nock from 'nock'

const expect = chai.expect
const should = chai.should()

const channelCreationParams = {
  type: 'amazonalexa',
  slug: 'my-awesome-channel',
  invocationName: 'My Bot',
  isActivated: true,
}

describe('Amazon Alexa Channel', () => {

  const { createChannel, deleteChannel,
    updateChannel, sendMessageToWebhook } = setupChannelIntegrationTests()
  const amazonAPI = 'https://api.amazon.com'

  beforeEach(async () => {
    nock(amazonAPI).post('/auth/o2/token').reply(200, {
      access_token: '1337',
      refresh_token: '1337',
    })
  })

  describe('creation', () => {
    it('should be successful with valid parameters', async () => {
      const response = await createChannel(channelCreationParams)
      const { results: result, message } = response.body

      expect(response.status).to.equal(201)
      expect(message).to.equal('Channel successfully created')
      expect(result.type).to.equal(channelCreationParams.type)
      expect(result.slug).to.equal(channelCreationParams.slug)
      expect(result.invocationName).to.equal(channelCreationParams.invocationName)
      expect(result.oAuthTokens).to.have.all.keys('access_token', 'refresh_token')
      expect(result.oAuthTokens.access_token).to.be.a('string')
      expect(result.oAuthTokens.refresh_token).to.be.a('string')
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
      const newValues = Object.assign({}, channelCreationParams)
      newValues.invocationName = 'Your Bot'
      response = await updateChannel(channel, newValues)
      expect(response.status).to.equal(200)
      expect(response.body.results.invocationName).to.equal(newValues.invocationName)
    })
  })

  describe('Deletion', () => {
    it('should be successful if channel exists', async () => {
      let response = await createChannel(channelCreationParams)
      const channel = response.body.results
      response = await deleteChannel(channel)
      expect(response.status).to.equal(200)
    })
  })

  describe('sending a message', () => {
    let channel
    const body = {
      version: '1.0',
      session: {
        new: false,
        sessionId: 'amzn1.echo-api.session.a313142e-bb3a-4cc1-8165-88ca4e1cf3fa',
        application: {
          applicationId: 'amzn1.ask.skill.0ef4a28b-1e00-49a9-b0f3-b67ea3364835',
        },
        user: {
          // eslint-disable-next-line max-len
          userId: 'amzn1.ask.account.AEB564HYZGUIB3AFFXONLUR4FHMGPT2OOLUHC5C3BOQZCGTI6RRW2IQBUWIX57TMYQ64PNNIWYSPVADY6GQUMBFOUHRI6L2H6O6ZDN2KSOGGIUJJKEWCW4L23I2FN3FWHS5OCUV6EQEH2OCRAIX75XPLXVOFNHUMFCHWYM3YWVA6E4JTMMLT7RKFP3QRTB3DU44MD54ARFWRQHQ',
        },
      },
      request: {
        type: 'IntentRequest',
        requestId: 'amzn1.echo-api.request.6013fceb-b7f9-4947-b796-b32afeb00580',
        timestamp: '2018-07-02T21:33:55Z',
        locale: 'en-US',
        intent: {
          name: 'CATCH_ALL_INTENT',
          confirmationStatus: 'NONE',
          slots: {
            CATCH_ALL_SLOT: {
              name: 'CATCH_ALL_SLOT',
              value: 'hallo',
              resolutions: {
                resolutionsPerAuthority: [
                  {
                    // eslint-disable-next-line max-len
                    authority: 'amzn1.er-authority.echo-sdk.amzn1.ask.skill.0ef4a28b-1e00-49a9-b0f3-b67ea3364835.CATCH_ALL_SLOT_TYPE',
                    status: {
                      code: 'ER_SUCCESS_NO_MATCH',
                    },
                  },
                ],
              },
              confirmationStatus: 'NONE',
            },
          },
        },
      },
    }
    beforeEach(async () => {
      channel = (await createChannel(channelCreationParams)).body.results
    })

    it('should be successful with valid parameters', async () => {
      // Hard-coded for testing purposes
      const signature = 'sha1=a3a1f35918b7b8c8d187e75dfa793a843e5c2b3c'
      const headers = { 'x-hub-signature': signature }
      const response = await sendMessageToWebhook(channel, body, headers)
      expect(response.status).to.equal(200)
      expect(response.body).to.have.all.keys('version', 'response', 'sessionAttributes',
        'userAgent')
      expect(response.body.version).to.equal('1.0')
      expect(response.body.response).to.have.all.keys('outputSpeech', 'shouldEndSession')
      expect(response.body.response.outputSpeech).to.have.all.keys('type', 'ssml')
      expect(response.body.response.outputSpeech.type).to.equal('SSML')
      expect(response.body.response.outputSpeech.ssml).to.equal('<speak>my message</speak>')
    })

    it('should return 400 with invalid parameters', async () => {
      try {
        await sendMessageToWebhook(channel, { version: '1337' })
        should.fail()
      } catch (error) {
        expect(error.status).to.equal(400)
      }
    })

  })
})
