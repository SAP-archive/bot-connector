import expect from 'expect.js'
import superagent from 'superagent'
import superagentPromise from 'superagent-promise'

import '../util/start_application'

const agent = superagentPromise(superagent, Promise)

describe('App Controller', () => {

  describe('GET /', () => {
    it('should be 200', async () => {
      const res = await agent.get(`${process.env.ROUTETEST}/v1`)
      expect(res.status).to.be(200)
    })
  })

  describe('POST /', () => {
    it('should be 200', async () => {
      const res = await agent.post(`${process.env.ROUTETEST}/v1`)
      expect(res.status).to.be(200)
    })
  })

})
