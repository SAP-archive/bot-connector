define({ "api": [
  {
    "type": "post",
    "url": "/bots/:bot_id/messages",
    "title": "Post a message to a specific bot",
    "name": "Post_a_message_to_a_bot",
    "group": "Bot",
    "description": "<p>Post a message to a specific. With this route, you do not have to only answer to an user as response of a previous message, we can also directly send him messages</p>",
    "parameter": {
      "fields": {
        "Route Parameters": [
          {
            "group": "Route Parameters",
            "type": "ObjectId",
            "optional": false,
            "field": "bot_id",
            "description": "<p>Bot ObjectId</p>"
          }
        ],
        "Text message parameters": [
          {
            "group": "Text message parameters",
            "type": "String",
            "optional": false,
            "field": "type",
            "defaultValue": "text",
            "description": "<p>Must be 'text' in this case</p>"
          },
          {
            "group": "Text message parameters",
            "type": "String",
            "optional": false,
            "field": "value",
            "description": "<p>Your message</p>"
          }
        ],
        "Quick replies parameters": [
          {
            "group": "Quick replies parameters",
            "type": "String",
            "optional": false,
            "field": "type",
            "defaultValue": "quickReplies",
            "description": "<p>Must be 'quickReplies' in this case</p>"
          },
          {
            "group": "Quick replies parameters",
            "type": "Object[]",
            "optional": false,
            "field": "value",
            "description": "<p>Array of quick reply</p>"
          },
          {
            "group": "Quick replies parameters",
            "type": "String",
            "optional": false,
            "field": "value.title",
            "description": "<p>Title of a quick reply button. This title will appear on channel UI</p>"
          },
          {
            "group": "Quick replies parameters",
            "type": "String",
            "optional": false,
            "field": "value.value",
            "description": "<p>Value of a quick reply button. This title will not appear on channel UI, but this will be sent to your bot if user click on it</p>"
          }
        ],
        "Picture message parameters": [
          {
            "group": "Picture message parameters",
            "type": "String",
            "optional": false,
            "field": "type",
            "defaultValue": "picture",
            "description": "<p>Must be 'picture' in this case</p>"
          },
          {
            "group": "Picture message parameters",
            "type": "String",
            "optional": false,
            "field": "value",
            "description": "<p>URL of your image</p>"
          }
        ],
        "Video message parameters": [
          {
            "group": "Video message parameters",
            "type": "String",
            "optional": false,
            "field": "type",
            "defaultValue": "video",
            "description": "<p>Must be 'video' in this case</p>"
          },
          {
            "group": "Video message parameters",
            "type": "String",
            "optional": false,
            "field": "value",
            "description": "<p>URL of your video</p>"
          }
        ],
        "Card message parameters": [
          {
            "group": "Card message parameters",
            "type": "String",
            "optional": false,
            "field": "type",
            "defaultValue": "card",
            "description": "<p>Must be 'card' in this case</p>"
          },
          {
            "group": "Card message parameters",
            "type": "Object[]",
            "optional": false,
            "field": "value",
            "description": "<p>Array of card</p>"
          },
          {
            "group": "Card message parameters",
            "type": "String",
            "optional": false,
            "field": "value.title",
            "description": "<p>Card title</p>"
          },
          {
            "group": "Card message parameters",
            "type": "String",
            "optional": false,
            "field": "value.imageUrl",
            "description": "<p>URL of the card image</p>"
          },
          {
            "group": "Card message parameters",
            "type": "Object[]",
            "optional": false,
            "field": "value.buttons",
            "description": "<p>Array of card buttons</p>"
          },
          {
            "group": "Card message parameters",
            "type": "String",
            "optional": false,
            "field": "value.buttons.title",
            "description": "<p>Title of the card button. This title will appear on channel UI</p>"
          },
          {
            "group": "Card message parameters",
            "type": "String",
            "optional": false,
            "field": "value.buttons.type",
            "description": ""
          },
          {
            "group": "Card message parameters",
            "type": "String",
            "optional": false,
            "field": "value.buttons.value",
            "description": "<p>Value of the card button. This title will not appear on channel UI, but this will be sent to your bot if user click on it</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Message[]",
            "optional": false,
            "field": "results",
            "description": "<p>Message array</p>"
          },
          {
            "group": "Success 200",
            "type": "ObjectId",
            "optional": false,
            "field": "results.id",
            "description": "<p>Message objectId</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.content",
            "description": "<p>Message content</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.type",
            "description": "<p>Message Type</p>"
          },
          {
            "group": "Success 200",
            "type": "Participant",
            "optional": false,
            "field": "results.participant",
            "description": "<p>Message Participant</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Message successfully posted</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400 for bot_id": [
          {
            "group": "Bad Request 400 for bot_id",
            "type": "null",
            "optional": false,
            "field": "results",
            "description": "<p>Response data</p>"
          },
          {
            "group": "Bad Request 400 for bot_id",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Parameter bot_id is invalid</p>"
          }
        ],
        "Bad Request 400 for conversation_id": [
          {
            "group": "Bad Request 400 for conversation_id",
            "type": "null",
            "optional": false,
            "field": "results",
            "description": "<p>Response data</p>"
          },
          {
            "group": "Bad Request 400 for conversation_id",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Parameter conversation_id is invalid</p>"
          }
        ],
        "Not found 404 for bot": [
          {
            "group": "Not found 404 for bot",
            "type": "null",
            "optional": false,
            "field": "results",
            "description": "<p>Response data</p>"
          },
          {
            "group": "Not found 404 for bot",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Bot not found</p>"
          }
        ],
        "Internal Server Error 500 if bot participant not found": [
          {
            "group": "Internal Server Error 500 if bot participant not found",
            "type": "null",
            "optional": false,
            "field": "results",
            "description": "<p>Response data</p>"
          },
          {
            "group": "Internal Server Error 500 if bot participant not found",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Bot participant not found in this conversation</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Messages.routes.js",
    "groupTitle": "Bot"
  },
  {
    "type": "POST",
    "url": "/bots",
    "title": "Create a Bot",
    "name": "createBot",
    "group": "Bot",
    "description": "<p>Create a new bot</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "url",
            "description": "<p>Bot url endpoint</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "results",
            "description": "<p>Bot information</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.id",
            "description": "<p>Bot id</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.url",
            "description": "<p>Bot url</p>"
          },
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "results.channels",
            "description": "<p>Array of Bot's Channels (see Channels)</p>"
          },
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "results.conversations",
            "description": "<p>Array of Bot's Conversations (see Conversations)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400 url not valid": [
          {
            "group": "Bad Request 400 url not valid",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if url is invalid</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Bots.routes.js",
    "groupTitle": "Bot"
  },
  {
    "type": "DELETE",
    "url": "/bots/:bot_id",
    "title": "Delete a bot",
    "name": "deleteBotById",
    "group": "Bot",
    "description": "<p>Delete a bot</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "bot_id",
            "description": "<p>Bot id</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400 bot_id not valid": [
          {
            "group": "Bad Request 400 bot_id not valid",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if bot_id is invalid</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Bots.routes.js",
    "groupTitle": "Bot"
  },
  {
    "type": "GET",
    "url": "/bots/:bot_id",
    "title": "Get a Bot",
    "name": "getBotById",
    "group": "Bot",
    "description": "<p>Get a Bot</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "bot_id",
            "description": "<p>Bot id</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "results",
            "description": "<p>Bot information</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.id",
            "description": "<p>Bot id</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.url",
            "description": "<p>Bot url</p>"
          },
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "results.channels",
            "description": "<p>Array of Channels (see Channels)</p>"
          },
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "results.conversations",
            "description": "<p>Array of Conversations (see Conversations)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400 bot_id is invalid": [
          {
            "group": "Bad Request 400 bot_id is invalid",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if bot_id is invalid</p>"
          }
        ],
        "Not found 404": [
          {
            "group": "Not found 404",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if the bot doesn't exist</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Bots.routes.js",
    "groupTitle": "Bot"
  },
  {
    "type": "GET",
    "url": "/bots/",
    "title": "Get list of Bots",
    "name": "getBots",
    "group": "Bot",
    "description": "<p>Get all the Bots</p>",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "results",
            "description": "<p>Array of Bot</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.id",
            "description": "<p>Bot id</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.url",
            "description": "<p>Bot url</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>success message</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Bots.routes.js",
    "groupTitle": "Bot"
  },
  {
    "type": "PUT",
    "url": "/bots/:bot_id",
    "title": "Update a bot",
    "name": "updateBotById",
    "group": "Bot",
    "description": "<p>Update a bot</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "bot_id",
            "description": "<p>Bot id</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "url",
            "description": "<p>Bot new url endpoint</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "results",
            "description": "<p>Bot information</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.id",
            "description": "<p>Bot id</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.url",
            "description": "<p>Bot url endpoint</p>"
          },
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "results.channels",
            "description": "<p>Array of Channels (see Channels)</p>"
          },
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "results.conversations",
            "description": "<p>Array of Conversations (see Conversations)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400 url not valid": [
          {
            "group": "Bad Request 400 url not valid",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if url is invalid</p>"
          }
        ],
        "Bad Request 400 bot_id not valid": [
          {
            "group": "Bad Request 400 bot_id not valid",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if bot_id is invalid</p>"
          }
        ],
        "Not found 404": [
          {
            "group": "Not found 404",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if the bot doesn't exist</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Bots.routes.js",
    "groupTitle": "Bot"
  },
  {
    "type": "post",
    "url": "/bots/:bot_id/channels",
    "title": "Create a Channel",
    "name": "createChannelByBotId",
    "group": "Channel",
    "description": "<p>Create a channel only with parameters provided.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "slug",
            "description": "<p>Channel slug</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "type",
            "description": "<p>Channel type</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>(Optionnal) Channel token (Messenger and Slack)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userName",
            "description": "<p>(Optionnal) Channel username (Kik)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "apiKey",
            "description": "<p>(Optionnal) Channel apiKey (Kik and Messenger)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "webhook",
            "description": "<p>(Optionnal) Channel webhook (Kik and Messenger)</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "isActivated",
            "description": "<p>Channel isActivated</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "results",
            "description": "<p>Channel information</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.slug",
            "description": "<p>Channel slug</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.type",
            "description": "<p>Channel type</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.token",
            "description": "<p>Channel token</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.userName",
            "description": "<p>Channel userName</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.apiKey",
            "description": "<p>Channel apiKey</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.webhook",
            "description": "<p>Channel webhook</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "results.isActivated",
            "description": "<p>Channel isActivated</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400 bot_id not valid": [
          {
            "group": "Bad Request 400 bot_id not valid",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if bot_id is invalid</p>"
          }
        ],
        "Bad Request 400 type not valid": [
          {
            "group": "Bad Request 400 type not valid",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if type is invalid</p>"
          }
        ],
        "Bad Request 400 isActivated not valid": [
          {
            "group": "Bad Request 400 isActivated not valid",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if isActivated is invalid</p>"
          }
        ],
        "Bad Request 400 slug not valid": [
          {
            "group": "Bad Request 400 slug not valid",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if slug is invalid</p>"
          }
        ],
        "Conflict 409 slug already taken": [
          {
            "group": "Conflict 409 slug already taken",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if slug is already taken in the current Bot scope</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Channels.routes.js",
    "groupTitle": "Channel"
  },
  {
    "type": "delete",
    "url": "/bots/:bot_id/channels/:channel_slug",
    "title": "Delete a Channel",
    "name": "deleteChannelByBotId",
    "group": "Channel",
    "description": "<p>Delete a Channel</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "channel_slug",
            "description": "<p>Channel slug.</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Not found 404": [
          {
            "group": "Not found 404",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if either the Bot or the Channel doesn't exist</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Channels.routes.js",
    "groupTitle": "Channel"
  },
  {
    "type": "get",
    "url": "/bots/:bot_id/channels/:channel_slug",
    "title": "Get a Channel",
    "name": "getChannelByBotId",
    "group": "Channel",
    "description": "<p>Get a Channel of a Bot</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "channel_slug",
            "description": "<p>Channel slug.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "results",
            "description": "<p>Channel information</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.channel_slug",
            "description": "<p>Channel slug.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.bot",
            "description": "<p>Bot object.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.slug",
            "description": "<p>Channel slug.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.type",
            "description": "<p>Channel type.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.token",
            "description": "<p>Channel token.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.userName",
            "description": "<p>Channel userName.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.apiKey",
            "description": "<p>Channel apiKey.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.webhook",
            "description": "<p>Channel webhook.</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "results.isActivated",
            "description": "<p>Channel isActivated.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400 bot_id not valid": [
          {
            "group": "Bad Request 400 bot_id not valid",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if bot_id is invalid</p>"
          }
        ],
        "Bad Request 400 channel_slug not valid": [
          {
            "group": "Bad Request 400 channel_slug not valid",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if channel_slug is invalid</p>"
          }
        ],
        "Not found 404": [
          {
            "group": "Not found 404",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if either the Bot or the Channel doesn't exist</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Channels.routes.js",
    "groupTitle": "Channel"
  },
  {
    "type": "get",
    "url": "/bots/:bot_id/channels",
    "title": "Get Channels",
    "name": "getChannelsByBotId",
    "group": "Channel",
    "description": "<p>Get all Channels of a Bot</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "bot_id",
            "description": "<p>Bot id</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "results",
            "description": "<p>Array of Channels</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.bot",
            "description": "<p>Bot object</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.slug",
            "description": "<p>Channel slug</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.type",
            "description": "<p>Channel type</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.token",
            "description": "<p>Channel token</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.userName",
            "description": "<p>Channel userName</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.apiKey",
            "description": "<p>Channel apiKey</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.webhook",
            "description": "<p>Channel webhook</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "results.isActivated",
            "description": "<p>Channel isActivated</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400 bot_id not valid": [
          {
            "group": "Bad Request 400 bot_id not valid",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if bot_id is invalid</p>"
          }
        ],
        "Not found 404": [
          {
            "group": "Not found 404",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if the Bot doesn't exist</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Channels.routes.js",
    "groupTitle": "Channel"
  },
  {
    "type": "put",
    "url": "/bots/:bot_id/channels/:channel_slug",
    "title": "Update a Channel",
    "name": "updateChannelByBotId",
    "group": "Channel",
    "description": "<p>Update a Channel</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "channel_slug",
            "description": "<p>Channel slug.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "slug",
            "description": "<p>Channel slug</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "type",
            "description": "<p>Channel type</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "token",
            "description": "<p>(Optionnal) Channel token (Messenger and Slack)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userName",
            "description": "<p>(Optionnal) Channel username (Kik)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "apiKey",
            "description": "<p>(Optionnal) Channel apiKey (Kik and Messenger)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "webhook",
            "description": "<p>(Optionnal) Channel webhook (Kik and Messenger)</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": false,
            "field": "isActivated",
            "description": "<p>Channel isActivated</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "results",
            "description": "<p>Channel information</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.channel_slug",
            "description": "<p>Channel slug.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.bot",
            "description": "<p>Bot object.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.slug",
            "description": "<p>Channel slug.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.type",
            "description": "<p>Channel type.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.token",
            "description": "<p>Channel token.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.userName",
            "description": "<p>Channel userName.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.apiKey",
            "description": "<p>Channel apiKey.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.webhook",
            "description": "<p>Channel webhook.</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "results.isActivated",
            "description": "<p>Channel isActivated.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400 bot_id not valid": [
          {
            "group": "Bad Request 400 bot_id not valid",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if bot_id is invalid</p>"
          }
        ],
        "Bad Request 400 channel_slug not valid": [
          {
            "group": "Bad Request 400 channel_slug not valid",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if channel_slug is invalid</p>"
          }
        ],
        "Not found 404": [
          {
            "group": "Not found 404",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if either the Bot or the Channel doesn't exist</p>"
          }
        ],
        "Conflict 409 slug already taken": [
          {
            "group": "Conflict 409 slug already taken",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if slug is already taken</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Channels.routes.js",
    "groupTitle": "Channel"
  },
  {
    "type": "delete",
    "url": "/bots/:bot_id/conversations/:conversation_id",
    "title": "Delete conversation",
    "name": "deleteConversationByBotId",
    "group": "Conversation",
    "description": "<p>Delete a Bots's Conversation</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "bot_id",
            "description": "<p>Bot id</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "conversation_id",
            "description": "<p>Conversation id</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400": [
          {
            "group": "Bad Request 400",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Parameter conversation_id is invalid</p>"
          }
        ],
        "Not Found 404": [
          {
            "group": "Not Found 404",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Bot or Conversation not found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Conversations.routes.js",
    "groupTitle": "Conversation"
  },
  {
    "type": "get",
    "url": "/bots/:bot_id/conversation/:conversation_id",
    "title": "Get Conversation",
    "name": "getConversationByBotId",
    "group": "Conversation",
    "description": "<p>Get a Conversation</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "bot_id",
            "description": "<p>Bot id</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "conversation_id",
            "description": "<p>Conversation id</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "results",
            "description": "<p>Conversation information</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.id",
            "description": "<p>Conversation id</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.channel",
            "description": "<p>Channel</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.bot",
            "description": "<p>Id of the bot</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.chatId",
            "description": "<p>id of the chat linked to the Conversation</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "results.isActive",
            "description": "<p>Conversation is active or not</p>"
          },
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "results.participants",
            "description": "<p>Array of Participants</p>"
          },
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "results.messages",
            "description": "<p>Array of Messages</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400": [
          {
            "group": "Bad Request 400",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Parameter conversation_id is invalid</p>"
          }
        ],
        "Not Found 404": [
          {
            "group": "Not Found 404",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Conversation not found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Conversations.routes.js",
    "groupTitle": "Conversation"
  },
  {
    "type": "get",
    "url": "/bots/:bot_id/conversations",
    "title": "Get all Conversations of a Bot",
    "name": "getConversationsByBotId",
    "group": "Conversation",
    "description": "<p>List all the Conversations of a Bot</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "bot_id",
            "description": "<p>Bot id</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "results",
            "description": "<p>Array of Conversations</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.id",
            "description": "<p>Conversation id</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.channel",
            "description": "<p>if of the Channel's Conversation</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.chatId",
            "description": "<p>id of the chat linked to the Conversation</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.bot",
            "description": "<p>ObjectId of the bot conversation</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.isActive",
            "description": "<p>Conversation is active or not</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>success message</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400": [
          {
            "group": "Bad Request 400",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Return if bot_id is invalid</p>"
          }
        ],
        "Not Found 404": [
          {
            "group": "Not Found 404",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Bot not found</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Conversations.routes.js",
    "groupTitle": "Conversation"
  },
  {
    "type": "post",
    "url": "/bots/:bot_id/conversations/:conversation_id/messages",
    "title": "Post a message into a specific conversation",
    "name": "Post_a_message_to_a_conversation",
    "group": "Messages",
    "description": "<p>Post a message into a specific conversation. With this route, you do not have to only answer to an user as response of a previous message, we can also directly send him messages</p>",
    "parameter": {
      "fields": {
        "Route Parameters": [
          {
            "group": "Route Parameters",
            "type": "ObjectId",
            "optional": false,
            "field": "bot_id",
            "description": "<p>Bot ObjectId</p>"
          },
          {
            "group": "Route Parameters",
            "type": "ObjectId",
            "optional": false,
            "field": "conversation_id",
            "description": "<p>Conversation ObjectId</p>"
          }
        ],
        "Text message parameters": [
          {
            "group": "Text message parameters",
            "type": "String",
            "optional": false,
            "field": "type",
            "defaultValue": "text",
            "description": "<p>Must be 'text' in this case</p>"
          },
          {
            "group": "Text message parameters",
            "type": "String",
            "optional": false,
            "field": "value",
            "description": "<p>Your message</p>"
          }
        ],
        "Quick replies parameters": [
          {
            "group": "Quick replies parameters",
            "type": "String",
            "optional": false,
            "field": "type",
            "defaultValue": "quickReplies",
            "description": "<p>Must be 'quickReplies' in this case</p>"
          },
          {
            "group": "Quick replies parameters",
            "type": "Object[]",
            "optional": false,
            "field": "value",
            "description": "<p>Array of quick reply</p>"
          },
          {
            "group": "Quick replies parameters",
            "type": "String",
            "optional": false,
            "field": "value.title",
            "description": "<p>Title of a quick reply button. This title will appear on channel UI</p>"
          },
          {
            "group": "Quick replies parameters",
            "type": "String",
            "optional": false,
            "field": "value.value",
            "description": "<p>Value of a quick reply button. This title will not appear on channel UI, but this will be sent to your bot if user click on it</p>"
          }
        ],
        "Picture message parameters": [
          {
            "group": "Picture message parameters",
            "type": "String",
            "optional": false,
            "field": "type",
            "defaultValue": "picture",
            "description": "<p>Must be 'picture' in this case</p>"
          },
          {
            "group": "Picture message parameters",
            "type": "String",
            "optional": false,
            "field": "value",
            "description": "<p>URL of your image</p>"
          }
        ],
        "Video message parameters": [
          {
            "group": "Video message parameters",
            "type": "String",
            "optional": false,
            "field": "type",
            "defaultValue": "video",
            "description": "<p>Must be 'video' in this case</p>"
          },
          {
            "group": "Video message parameters",
            "type": "String",
            "optional": false,
            "field": "value",
            "description": "<p>URL of your video</p>"
          }
        ],
        "Card message parameters": [
          {
            "group": "Card message parameters",
            "type": "String",
            "optional": false,
            "field": "type",
            "defaultValue": "card",
            "description": "<p>Must be 'card' in this case</p>"
          },
          {
            "group": "Card message parameters",
            "type": "Object[]",
            "optional": false,
            "field": "value",
            "description": "<p>Array of card</p>"
          },
          {
            "group": "Card message parameters",
            "type": "String",
            "optional": false,
            "field": "value.title",
            "description": "<p>Card title</p>"
          },
          {
            "group": "Card message parameters",
            "type": "String",
            "optional": false,
            "field": "value.imageUrl",
            "description": "<p>URL of the card image</p>"
          },
          {
            "group": "Card message parameters",
            "type": "Object[]",
            "optional": false,
            "field": "value.buttons",
            "description": "<p>Array of card buttons</p>"
          },
          {
            "group": "Card message parameters",
            "type": "String",
            "optional": false,
            "field": "value.buttons.title",
            "description": "<p>Title of the card button. This title will appear on channel UI</p>"
          },
          {
            "group": "Card message parameters",
            "type": "String",
            "optional": false,
            "field": "value.buttons.type",
            "description": ""
          },
          {
            "group": "Card message parameters",
            "type": "String",
            "optional": false,
            "field": "value.buttons.value",
            "description": "<p>Value of the card button. This title will not appear on channel UI, but this will be sent to your bot if user click on it</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Message",
            "optional": false,
            "field": "results",
            "description": "<p>Message object</p>"
          },
          {
            "group": "Success 200",
            "type": "ObjectId",
            "optional": false,
            "field": "results.id",
            "description": "<p>Message objectId</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.content",
            "description": "<p>Message content</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.type",
            "description": "<p>Message Type</p>"
          },
          {
            "group": "Success 200",
            "type": "Participant",
            "optional": false,
            "field": "results.participant",
            "description": "<p>Message Participant</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Message successfully posted</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400 for bot_id": [
          {
            "group": "Bad Request 400 for bot_id",
            "type": "null",
            "optional": false,
            "field": "results",
            "description": "<p>Response data</p>"
          },
          {
            "group": "Bad Request 400 for bot_id",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Parameter bot_id is invalid</p>"
          }
        ],
        "Bad Request 400 for conversation_id": [
          {
            "group": "Bad Request 400 for conversation_id",
            "type": "null",
            "optional": false,
            "field": "results",
            "description": "<p>Response data</p>"
          },
          {
            "group": "Bad Request 400 for conversation_id",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Parameter conversation_id is invalid</p>"
          }
        ],
        "Not found 404 for bot": [
          {
            "group": "Not found 404 for bot",
            "type": "null",
            "optional": false,
            "field": "results",
            "description": "<p>Response data</p>"
          },
          {
            "group": "Not found 404 for bot",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Bot not found</p>"
          }
        ],
        "Not found 404 for conversation": [
          {
            "group": "Not found 404 for conversation",
            "type": "null",
            "optional": false,
            "field": "results",
            "description": "<p>Response data</p>"
          },
          {
            "group": "Not found 404 for conversation",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Conversation not found</p>"
          }
        ],
        "Internal Server Error 500 if bot participant not found": [
          {
            "group": "Internal Server Error 500 if bot participant not found",
            "type": "null",
            "optional": false,
            "field": "results",
            "description": "<p>Response data</p>"
          },
          {
            "group": "Internal Server Error 500 if bot participant not found",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Bot participant not found in this conversation</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Messages.routes.js",
    "groupTitle": "Messages"
  },
  {
    "type": "get",
    "url": "/bots/:bot_id/participants",
    "title": "Index Bot's Participants",
    "name": "List_participants",
    "group": "Participants",
    "description": "<p>Index bot participants (for all conversations and all channels)</p>",
    "parameter": {
      "fields": {
        "Route Parameters": [
          {
            "group": "Route Parameters",
            "type": "ObjectId",
            "optional": false,
            "field": "bot_id",
            "description": "<p>Bot id</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200 with at least one participant": [
          {
            "group": "Success 200 with at least one participant",
            "type": "Array",
            "optional": false,
            "field": "results",
            "description": "<p>Array of participants</p>"
          },
          {
            "group": "Success 200 with at least one participant",
            "type": "ObjectId",
            "optional": false,
            "field": "results.id",
            "description": "<p>Participant objectId</p>"
          },
          {
            "group": "Success 200 with at least one participant",
            "type": "String",
            "optional": false,
            "field": "results.name",
            "description": "<p>Participant name</p>"
          },
          {
            "group": "Success 200 with at least one participant",
            "type": "String",
            "optional": false,
            "field": "results.slug",
            "description": "<p>Participant slug</p>"
          },
          {
            "group": "Success 200 with at least one participant",
            "type": "Object",
            "optional": false,
            "field": "results.information",
            "description": "<p>Particpant information</p>"
          },
          {
            "group": "Success 200 with at least one participant",
            "type": "Boolean",
            "optional": false,
            "field": "results.isBot",
            "description": "<p>Is this particpant a bot ?</p>"
          },
          {
            "group": "Success 200 with at least one participant",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Participants successfully rendered</p>"
          }
        ],
        "Success 200 with no participant": [
          {
            "group": "Success 200 with no participant",
            "type": "null",
            "optional": false,
            "field": "results",
            "description": "<p>Response data</p>"
          },
          {
            "group": "Success 200 with no participant",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>No participants</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400": [
          {
            "group": "Bad Request 400",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Parameter bot_id is invalid</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Participants.routes.js",
    "groupTitle": "Participants"
  },
  {
    "type": "get",
    "url": "/bots/:bot_id/participants/:participant_id",
    "title": "Show bot a specific participant (for a bot)",
    "name": "Show_participant",
    "group": "Participants",
    "description": "<p>Show bot a specific participant (for a bot)</p>",
    "parameter": {
      "fields": {
        "Route Parameters": [
          {
            "group": "Route Parameters",
            "type": "ObjectId",
            "optional": false,
            "field": "bot_id",
            "description": "<p>Bot ObjectId</p>"
          },
          {
            "group": "Route Parameters",
            "type": "ObjectId",
            "optional": false,
            "field": "participant_id",
            "description": "<p>Participant ObjectId</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Participant",
            "optional": false,
            "field": "results",
            "description": "<p>Participant</p>"
          },
          {
            "group": "Success 200",
            "type": "ObjectId",
            "optional": false,
            "field": "results.id",
            "description": "<p>Participant objectId</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.name",
            "description": "<p>Participant name</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "results.slug",
            "description": "<p>Participant slug</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "results.information",
            "description": "<p>Particpant information</p>"
          },
          {
            "group": "Success 200",
            "type": "Boolean",
            "optional": false,
            "field": "results.isBot",
            "description": "<p>Is this particpant a bot ?</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Participant successfully rendered</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "Bad Request 400 for bot_id": [
          {
            "group": "Bad Request 400 for bot_id",
            "type": "null",
            "optional": false,
            "field": "results",
            "description": "<p>Response data</p>"
          },
          {
            "group": "Bad Request 400 for bot_id",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Parameter bot_id is invalid</p>"
          }
        ],
        "Bad Request 400 for participant_id": [
          {
            "group": "Bad Request 400 for participant_id",
            "type": "String",
            "optional": false,
            "field": "message",
            "description": "<p>Parameter participant_id is invalid</p>"
          }
        ]
      }
    },
    "version": "0.0.0",
    "filename": "src/routes/Participants.routes.js",
    "groupTitle": "Participants"
  }
] });
