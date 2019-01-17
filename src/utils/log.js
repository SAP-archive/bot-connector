import winston from 'winston'

export const winstonLogger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      handleExceptions: true,
      level: 'info',
      prettyPrint: true,
      timestamp: true,
    }),
  ],
  exitOnError: false,
})

winstonLogger.stream = {
  write: (message) => {
    winstonLogger.info(message)
  },
}

export const logger = {
  error: (...messages) => messages.map(message => winstonLogger.error(message)),
  warning: (...messages) => messages.map(message => winstonLogger.warn(message)),
  info: (...messages) => messages.map(message => winstonLogger.info(message)),
  debug: (...messages) => messages.map(message => winstonLogger.debug(message)),
}

