# [Archieved] Open Source Bot Connector

This repository has been archived as communicated earlier (August, 2019) and the source code is not maintained by SAP Conversational AI team.

All Bot Connector capabilities are integrated in our [bot building platform](https://cai.tools.sap).

If you are running a standard / customised version of open source bot connector on your platform, **please migrate to the bot connector available on our bot building platform** (hosted in on SAP Cloud Platform), which offers integration with a wide number of channels which that we plan to make more robust.

If you have any questions, please [contact our team](https://cai.tools.sap/contact).
##
![Bot Connector Logo](https://cdn.cai.tools.sap/bot-connector/bot-connector-logo.png)

| [Supported Channels](#supported-channels) | [Getting Started](#getting-started) | [How it works](#how-it-works) | [Messages Formats](#messages-format) | [Getting Started with SAP Conversational AI]( #getting-started-with-sap-conversational-ai) |
|---|---|---|---|---|

[💬 Questions / Comments? Join the discussion on our community Slack channel!](https://slack.cai.tools.sap)

## Bot Connector

Bot Connector allows you to connect your bot to multiple messaging channels.

It provides a higher level API to manage several messaging platforms at once, and lets you focus on your bot by using a simple and unique format to talk to the entire world.

## Documentation

You can see the API documentation [here](https://sapconversationalai.github.io/bot-connector/)

Or generate the documentation with the following command:
```bash
yarn docs && open docs/index.html
```

## Supported Channels

Bot Connector supports the following channels:

* [Kik](https://github.com/SAPConversationalAI/bot-connector/wiki/Channel---Kik)
* [Slack](https://github.com/SAPConversationalAI/bot-connector/wiki/Channel---Slack)
* [Facebook Messenger](https://github.com/SAPConversationalAI/bot-connector/wiki/Channel---Messenger)
* [Callr](https://github.com/SAPConversationalAI/bot-connector/wiki/Channel-CALLR)
* [Telegram](https://github.com/SAPConversationalAI/bot-connector/wiki/Channel-Telegram)
* [Twilio](https://github.com/SAPConversationalAI/bot-connector/wiki/Channel-Twilio)
* [Cisco Webex](https://github.com/SAPConversationalAI/bot-connector/wiki/Channel-Cisco)
* [Microsoft Bot Framework (Skype, Teams, Cortana,...)](https://github.com/SAPConversationalAI/bot-connector/wiki/Channel-Microsoft-Bot-Framework)
* [Twitter](https://github.com/SAPConversationalAI/bot-connector/wiki/Channel-Twitter)
* Line

You can find more information on each channel in the [wiki](https://github.com/SAPConversationalAI/bot-connector/wiki)

More will be added, and you can contribute if you want to, and add a thumbs up for the channel you want to see implemented first ;)
(To do so, fork this repo, add a thumbs up and make a PR!)


* Discord 👍👍👍
* Ryver 👍
* Viber
* Wechat 👍👍
* Zinc.it 👍
* Salesforce 👍

## Getting started

The following examples use [yarn](https://github.com/yarnpkg/yarn) package manager but you can use your favorite one like npm, or pnpm.

In order to run the connector you need MongoDB and Redis installed and running. The configuration files for both are stored in *config* directory.

### Installation

Clone the repository and install the dependencies

```sh
git clone https://github.com/SAPConversationalAI/bot-connector.git
cd bot-connector
yarn install
```

### Available Commands

* `yarn start` - Start application in production mode
* `yarn start:dev` - Start application in development mode
* `yarn start:dev:debug` - Start application in development mode with debugger
* `yarn test` - Run unit & integration tests
* `yarn test:debug` - Run unit & integration tests with debugger
* `yarn test:coverage` - Run unit & integration tests with coverage report
* `yarn lint` - Run ESLint
* `yarn build` - Build artifacts for production
* `yarn docs` - Generate apidoc documentation

#### Configurations/Environments

You need to create a configuration file based on the following schema:

config/{env}.js (e.g. `config/development.js` for `NODE_ENV=development`)

```
module.exports = {
  db: {
    host: 'localhost',
    port: 27017,
    dbName: 'botconnector',
  },
  server: {
    port: 8080,
  },
  redis: {
    port: 6379,
    host: 'localhost',
    auth: '',
    db: 7,
    options: {},  // see https://github.com/mranney/node_redis#rediscreateclient
  },
  mail: {},  // valid object to be passed to nodemail.createTransport()
  base_url: '',  // base url of the connector
  facebook_app_id: '',
  facebook_app_secret: '',
  facebook_app_webhook_token: '',
  amazon_client_id: '',  // Client ID for use with Login with Amazon (Amazon Alexa channel)
  amazon_client_secret: '',  // Client Id for use with Login with Amazon (Amazon Alexa channel)
}

```

#### Running in development mode (hot reload)

```bash
yarn start:dev
```

#### Setup your connector

First of all, you need to create a connector with the Bot Connector's API.
```sh
curl -X POST 'http://localhost:8080/connectors' --data 'url=YOUR_BOT_ENDPOINT_URL'
```

Then you need some code so the Bot Connector, via the *connector* you've just created, can send you the messages it receives. You can use the code from the *example* as a starter.
```bash
cd example
yarn install
yarn start
```

Now that your bot (well, your code) and the Bot Connector are running, you have to create channels. A channel is the actual link between your bot (the connector) and a specific service like Messenger, Slack or Kik. One connector can have multiple channels.

## How it works

There are two distinct flows:
* your bot receives a message from a channel
* your bot sends a message to a channel

This pipeline allows us to have an abstraction of messages independent of the platform and implement only a few functions for each messaging platform (input and output parsing).

#### Receive a message

The Bot Connector posts on the endpoint stored with the connector each time a new message arrives from a channel.
* a new message is received by Bot Connector
* the message is parsed by the corresponding service
* the message is saved in MongoDB
* the message is post to the bot endpoint

![BotConnector-Receive](https://cdn.cai.tools.sap/bot-connector/flow-1.png)

#### Post a message

To send a new message, you have to post it to Bot Connector's API
* the messages are saved in MongoDB
* the messages are formatted by the corresponding service to match the channel's format
* the messages are sent by Bot Connector to the corresponding channel

![BotConnector-Sending](https://cdn.cai.tools.sap/bot-connector/flow-2.png)

## Messages format

All messages coming from the bot are parsed and modified to match the destination channel specifications.
Bot Connector supports several message formats:

* Text

```js
{
  type: 'text',
  content: 'MY_TEXT',
}
```

* Picture

```js
{
  type: 'picture',
  content: 'IMAGE_URL',
}
```

* Video

```js
{
  type: 'video',
  content: 'VIDEO_URL',
}
```

* Quick Replies

```js
{
  type: 'quickReplies',
  content: {
    title: 'TITLE',
    buttons: [
      {
        title: 'BUTTON_1_TITLE',
        value: 'BUTTON_1_VALUE',
      }, {
        title: 'BUTTON_2_TITLE',
        value: 'BUTTON_2_VALUE',
      }
    ]
  }
}
```

* List
```js
{
  type: 'list',
  content: {
    elements: [
      {
        title: 'ELEM_1_TITLE',
        imageUrl: 'IMAGE_URL',
        subtitle: 'ELEM_1_SUBTITLE',
        buttons: [
          {
            title: 'BUTTON_1_TITLE',
            value: 'BUTTON_1_VALUE',
            type: 'BUTTON_TYPE',
          }
        ]
      }
    ],
    buttons: [
      {
        title: 'BUTTON_1_TITLE',
        value: 'BUTTON_1_VALUE',
        type: 'BUTTON_TYPE',
      }
    ]
  }
}
```

* Card

```js
{
  type: 'card',
  content: {
    title: 'CARD_TITLE',
    subtitle: 'CARD_SUBTITLE',
    imageUrl: 'IMAGE_URL',
    buttons: [
      {
        title: 'BUTTON_TITLE',
        type: 'BUTTON_TYPE', // See Facebook Messenger button formats
        value: 'BUTTON_VALUE',
      }
    ],
  },
}
```

* Carousel

```js
{
  type: 'carousel',
  content: [
    {
      title: 'CARD_1_TITLE',
      imageUrl: 'IMAGE_URL',
      buttons: [
        {
          title: 'BUTTON_1_TITLE',
          value: 'BUTTON_1_VALUE',
          type: 'BUTTON_1_TYPE',
        }
      ]
    }
  ],
}
```


## Getting started with SAP Conversational AI

We build products to help enterprises and developers have a better understanding of user inputs.

-   **NLP API**: a unique API for text processing, and augmented training.
-   **Bot Building Tools**: all you need to create smart bots powered by SAP Conversational AI's NLP API. Design even the most complex conversation flow, use all rich messaging formats and connect to external APIs and services.
-   **Bot Connector API**: standardizes the messaging format across all channels, letting you connect your bots to any channel in minutes.

Learn more about:

| [API Documentation](https://cai.tools.sap/docs/api-reference/) | [Discover the platform](https://cai.tools.sap/docs/concepts/create-builder-bot) | [First bot tutorial](https://cai.tools.sap/blog/build-your-first-bot-with-recast-ai/) | [Advanced NodeJS tutorial](https://cai.tools.sap/blog/nodejs-chatbot-movie-bot/) | [Advanced Python tutorial](https://cai.tools.sap/blog/python-cryptobot/) |
|---|---|---|---|---|
