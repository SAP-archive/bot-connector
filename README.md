![Bot Conector Logo](https://cdn.recast.ai/bot-connector/bot-connector-logo.png)

# Bot Connector

Bot Connector allows you to connect your bot to multiple messaging channels.

It provides a higher level API to manage several messaging platforms at once, and lets you focus on your bot by using a simple and unique format to talk to the entire world.

## Documentation

You can see the API documentation [here](https://recastai.github.io/bot-connector/)

Or generate the documentation with the following command:
```bash
yarn doc && open doc/index.html
```

## Supported Channels

Bot Connector supports the following channels:
* [Kik](https://github.com/RecastAI/bot-connector/wiki/Channel---Kik)
* [Slack](https://github.com/RecastAI/bot-connector/wiki/Channel---Slack)
* [Messenger](https://github.com/RecastAI/bot-connector/wiki/Channel---Messenger)
* [Callr](https://github.com/RecastAI/bot-connector/wiki/Channel-CALLR)
* [Telegram](https://github.com/RecastAI/bot-connector/wiki/Channel-Telegram)
* [Twilio](https://github.com/RecastAI/bot-connector/wiki/Channel-Twilio)

You can find more information on each channel in the [wiki](https://github.com/RecastAI/bot-connector/wiki)

More will be added, and you can [contribute](https://github.com/RecastAI/bot-connector/blob/master/CONTRIBUTING.md) if you want to, and add a thumbs up for the channel you want to see implemented first ;)
(To do so, fork this repo, add a thumbs up and make a PR!)

* Cisco Spark 👍👍
* Discord 👍👍
* Line 👍
* Microsoft Teams 👍
* Ryver 👍
* Skype 👍
* Viber
* Wechat 👍👍
* Zinc.it 👍
* Twitter 👍
* Salesforce 

You can find the current roadmap [here](https://github.com/RecastAI/bot-connector/projects/1).

## Getting started

The following examples use [yarn](https://github.com/yarnpkg/yarn) package manager but you can use your favorite one like npm, or pnpm.

In order to run the connector you need MongoDB installed and running. The configuration files for MongoDB are stored in *config* directory.

### Installation

Clone the repository and install the dependencies

```sh
git clone https://github.com/RecastAI/bot-connector.git
cd bot-connector
yarn install
```

#### Running in development mode (hot reload)

```bash
yarn start-dev
```

#### Setup your connector

First of all, you need to create a connector with the Bot Connector's API.
```sh
curl -X POST 'http://localhost:8080/connectors' --data 'url=YOUR_CONNECTOR_ENDPOINT_URL'
```

Then you need some code so the Bot Connector, via the *connector* you've just created, can send you the messages it receives. You can use the code from the *example* as a starter.
```bash
cd example
yarn install
yarn start
```

Now that your bot (well, your code) and the Bot Connector are running, you have to create channels. Channel is the actual link between your connector and a specific service like Messenger, Slack or Kik. A connector can have multiple channels.

## How it works

There are two distinct flows:
* your bot receive a message from a channel
* your bot send a message to a channel

This pipeline allows us to have an abstraction of messages independent of the platform and implement only a few functions for each messaging platform (input and output parsing).

#### Receive a message

The Bot Connector posts on your connector's endpoint each time a new message arrives from a channel.
* a new message is received by Bot Connector
* the message is parsed by the corresponding service
* the message is saved in MongoDB
* the message is post to the connector endpoint

![BotConnector-Receive](https://cdn.recast.ai/bot-connector/flow-1.png)

#### Post a message

To send a new message, you have to post it to Bot Connector's API
* the messages are saved in MongoDB
* the messages are formatted by the corresponding service to match the channel's format
* the messages are sent by Bot Connector to the corresponding channel

![BotConnector-Sending](https://cdn.recast.ai/bot-connector/flow-2.png)

## Messages format

All messages coming from the bot are parsed and modified to match the destination channel specifications.
Bot Connector supports several message formats:

* Text message:

```javascript
[{
  type: 'text',
  content: 'My text message',
}]
```
* Quick Replies:

```javascript
[{
  type: 'quickReplies',
  content: {
    title: 'My title',
    buttons: [
      {
        title: 'Button title',
        value: 'Button value',
      },
    ]
  }
}]
```

* Cards:

```javascript
[{
  type: 'card',
  content: {
    title: 'My card title',
    imageUrl: 'url_to_my_image',
    subtitle: 'My card subtitle',
    buttons: [
      {
        title: 'My button title',
        type: 'My button type', // See Facebook Messenger button formats
        value: 'My button value',
      }
    ],
  },
}]
```

* Pictures:

```javascript
[{
  type: 'picture',
  content: 'url_to_my_image',
}]
```
* Videos:

```javascript
[{
  type: 'video',
  content: 'url_to_my_video',
}]
```

### Issue

If you encounter any issue, please follow this [guide](https://github.com/RecastAI/bot-connector/blob/master/ISSUE.md).

### Contribution

Want to contribute? Great! Please check this [guide](https://github.com/RecastAI/bot-connector/blob/master/CONTRIBUTING.md).

### License

Copyright (c) [2016] [Recast.AI](https://recast.ai)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
