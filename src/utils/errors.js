import { logger } from '../utils'

export class AppError extends Error {
  constructor (message = '', results = null, status = 500) {
    super(message)
    this.constructor = AppError
    // eslint-disable-next-line no-proto
    this.__proto__ = AppError.prototype
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
    this.status = status
    this.content = { message, results }
  }
  render (res) {
    return res.status(this.status).json(this.content)
  }
}

/**
 * 400 - Bad request
 */
export class BadRequestError extends AppError {
  constructor (message, results) {
    super(message, results, 400)
  }
}

/**
 * 401 - Forbidden
 */
export class ForbiddenError extends AppError {
  constructor (message = 'Request can not be processed with your role', results) {
    super(message, results, 401)
  }
}

/**
 * 403 - Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor (message = 'Request can not be processed without authentication', results) {
    super(message, results, 403)
  }
}

/**
 * 404 - Not found
 */
export class NotFoundError extends AppError {
  constructor (target = 'Model', results) {
    const message = `${target} not found`
    super(message, results, 404)
  }
}

/*
 * 409 - Conflict
 */
export class ConflictError extends AppError {
  constructor (message, results) {
    super(message, results, 409)
  }
}

/*
 * 503 - Service unavailable
 */
export class ServiceError extends AppError {
  constructor (message, results) {
    super(message, results, 503)
  }
}

/**
 * 200 - Stop Pipeline
 */
export class StopPipeline {
  constructor (content) {
    logger.warning('Abuse of JS exception mechanism')
    this.content = content
  }
  render (res) {
    return res.status(200).send(this.content)
  }
}

/**
 * Render the appropriate error
 */
export const renderError = (res, err) => {
  if (err instanceof AppError || err instanceof StopPipeline) {
    return err.render(res)
  }
  logger.error('Internal Server Error', (err && err.stack) || (err && err.message) || err)

  // Prevent sending twice a response in case of
  // forwarding message from a channel to a bot
  if (res.headersSent) { return }
  return res.status(500).json(err)
}
