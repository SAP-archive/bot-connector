const COLOR = {
  BLACK: '30',
  RED: '31',
  GREEN: '32',
  YELLOW: '33',
  BLUE: '34',
  PINK: '35',
  CYAN: '36',
  GREY: '37',
}

/* eslint-disable no-console */
class Logger {
  static error (...messages) {
    if (process.env.NODE_ENV === 'test') { return }

    messages.map(message => Logger.show(message, COLOR.RED))
  }

  static success (...messages) {
    messages.map(message => Logger.show(message, COLOR.GREEN))
  }

  static warning (...messages) {
    messages.map(message => Logger.show(message, COLOR.YELLOW))
  }

  static info (...messages) {
    messages.map(message => Logger.show(message, COLOR.CYAN))
  }

  static log (...messages) {
    messages.map(message => Logger.show(message))
  }

  static show (message, color) {
    if (process.env.NODE_ENV !== 'test') {
      if (!color) {
        console.log(message)
      } else {
        console.log(`\x1b[${color}m`, `${message}`, '\x1b[0m')
      }
    }
  }
}

module.exports = Logger
/* eslint-esable no-console */
