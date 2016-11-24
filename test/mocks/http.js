import nock from 'nock'

const scope = nock('https://api.kik.com')

scope.post('/v1/config')
.reply(200, {
  good: true,
})

scope.post('/v1/message')
.reply(200, {
  good: true,
})
