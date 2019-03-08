const express = require('express')
const bodyParser = require('body-parser')
const request = require('superagent')

const app = express()
app.set('port', process.env.PORT || 5000)
app.use(bodyParser.json())

const config = { url: 'http://localhost:8080', connectorId: 'yourConnectorId' }

/* Get the request from the connector */

app.post('/', (req, res) => {
  // const conversationId = req.body.message.conversation
  const messages = [{
    type: 'text',
    content: 'my first message',
  }]

  // send a response to the user
  res.send(messages)
})

/* example for sending a message to the connector */
// request.post(`${config.url}/connectors/${config.connectorId}/conversations/${conversationId}/messages`)
//   .send({ messages, senderId: req.body.senderId })
//   .end((err, response) => {
//     if (err) {
//       console.error(err)
//       res.status(500).send({ error: 'An internal error occured.' })
//     } else {
//       console.log(response)
//       res.send()
//     }
//   })

app.listen(app.get('port'), () => {
  console.log('Our bot is running on port', app.get('port'))
})
