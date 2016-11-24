import express from 'express'
import bodyParser from 'body-parser'
import request from 'superagent'

const app = express()
app.set('port', process.env.PORT || 5000)
app.use(bodyParser.json())

const config = { url: 'http://localhost:8080', botId: 'yourBotId' }

  /* Get the request from the connector */

  app.post('/', (req, res) => {
    const conversationId = req.body.message.conversation
      const message = [{
        type: 'text',
        content: 'my first message',
      }]

    /* Send the message back to the connector */
    request.post(`${config.url}/bots/${config.botId}/conversations/${conversationId}/messages`)
      .send({ messages, senderId: req.body.senderId })
      .end((err, res) => {
        if (err) {
          console.log(err)
        } else {
          console.log(res)
        }
      })
  })

app.listen(app.get('port'), () => {
  console.log('Our bot is running on port', app.get('port'))
})
