# Recast.AI Connector

Connector allows you to connect your bot to multiple messaging channels.

It provides a higher level API to manage several messaging platforms at once, and lets you focus on our bot by using a simple and unique format to talk to the entire world.

## Documentation

You can find the Connector's documentation [here]().

## Supported Channels

Connector supports the following channels:
* [Kik](https://github.com/RecastAI/bot-connector/wiki/Channel---Kik)
* [Slack](https://github.com/RecastAI/bot-connector/wiki/Channel---Slack)
* [Messenger](https://github.com/RecastAI/bot-connector/wiki/Channel---Messenger)

More will be added, and you can [contribute]() if you want to.

You can find more information on each channel in the [wiki](https://github.com/RecastAI/bot-connector/wiki)

## Getting started

The following examples use [yarn](https://github.com/yarnpkg/yarn) package manager but you can use your favorite one like npm, or pnpm.

In order to run the connector you need MongoDB installed and running. The configuration files for MongoDB are stored in *config* directory.

### Installation

Clone the repository and install the dependencies

```sh
git clone https://github.com/RecastAI/connector.git
cd connector
yarn install
```

#### Running in development mode (hot reload)

```bash
yarn start-dev
```

#### Setup your bot

First you need to create a bot with Connector's API:
```sh
curl -X POST 'http://localhost:8080/bots' --data 'url=YOUR_BOT_ENDPOINT_URL'
```

Now you need the bot itself. You can use the bot in the *example* directory as a starter.
```bash
cd example
yarn install
yarn start
```

Now that your bot and Connector are running, you have to create channels to let your bot talk on whatever messaging platform you want. Refer to channels' wiki pages for channel-specific examples.

## How it works

There are two distinct flows:
* your bot receive a message from a channel
* your bot send a message to a channel

This pipeline allows us to have an abstraction of messages independent of the platform and implement only a few functions for each messaging platform (input and output parsing).

#### Receive a message

Connector posts on your bot endpoint each time a new message arrives from a channel.
1. a new message is received by Connector
2. the message is parsed by the corresponding service
3. the message is saved in MongoDB
4. the message is post to the bot endpoint

#### Post a message

To send a new message, you have to post it the to Connector's API
1. the messages are saved in MongoDB
2. the messages are formatted by the corresponding service to match the channel's format
3. the messages are sent by Connector to the corresponding channel

## Messages format

All messages coming from the bot are parsed and modified to match the destination channel specifications.
Connector supports several message formats:

* Text message:

```javascript
{
  type: 'text',
  content: 'My text message',
}
```
* Quick Replies:

```javascript
{
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
}
```

* Cards:

```javascript
{
  type: 'card',
  content: {
    title: 'My card title',
    imageUrl: 'url_to_my_image',
    buttons: [
      {
        title: 'My button title',
        type: 'My button type', // See Facebook Messenger button formats
        value: 'My button value',
      }
    ],
  },
}
```

* Pictures:

```javascript
{
  type: 'picture',
  content: 'url_to_my_image',
}
```
* Videos:

```javascript
{
  type: 'video',
  content: 'url_to_my_video',
}
```

### Issue

If you encounter any issue, please follow this [guide]().

### Contribution

Want to contribute? Great! Please check this [guide]().

### License

Copyright (c) [2016] Recast.AI

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
