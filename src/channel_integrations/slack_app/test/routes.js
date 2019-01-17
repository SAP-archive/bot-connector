import expect from 'expect.js'

import { fetchMethod } from '../../../../test/tools'

import SlackAppChannel from '../channel'
import OauthRoutes from '../routes'

describe('Oauth Routes Testing', () => {
  describe('GET /oauth/slack/:channel_id', () => {
    it('should call SlackAppChannel#receiveOauth', async () => {
      expect(fetchMethod(OauthRoutes, 'GET', '/oauth/slack/:channel_id'))
        .to.equal(SlackAppChannel.receiveOauth)
    })
  })

})
