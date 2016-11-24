# Community Contributing Guide

Contributions are always welcome, no matter how large or small, from everyone.

If you'd like to help make Connector better, you totally rock! Here are some ways to contribute:
- by adding new messaging channels
- by reporting bugs you encounter or suggesting new features
- by improving the documentation
- by improving existing code
- by blackfilling unit tests for modules that lack coverage

If you want to add a new channel, please check this [wiki page](https://github.com/RecastAI/bot-connector/wiki/01---Add-a-channel) for more information.

## Guidelines

* Tests must pass
* Follow the existing coding style
* If you fix a bug, add a test

## Steps for Contributing

* create an issue with the bug you want to fix, or the feature that you want to add
* create your own fork on github
* write your code in your local copy
* make the tests and lint pass
* if everything is fine, commit your changes to your fork and create a pull request from there

## Setup

#### Installation
```sh
$ git clone https://github.com/RecastAI/Connector.git
$ cd Connector
$ yarn
```

#### Running in development mode (hot reload)

```sh
$ yarn start-dev
```

#### Testing

```sh
$ yarn test
$ yarn lint
```
