import {
  Logger,

  renderBadRequest,
  renderForbidden,
  renderUnauthorized,
  renderNotFound,
  renderConflict,
  renderInternalServerError,
  renderStopPipeline,
  renderServiceUnavailable,
} from '../utils'

/**
 * 400 - Bad request
 */
export class BadRequestError {
  constructor (message = null, results = null) {
    this.content = { message, results }
  }
}

/**
 * 401 - Forbidden
 */
export class ForbiddenError {
  constructor (message = 'Request can not be processed with your role', results = null) {
    this.content = { message, results }
  }
}

/**
 * 403 - Unauthorized
 */
export class UnauthorizedError {
  constructor (message = 'Request can not be processed without authentication', results = null) {
    this.content = { message, results }
  }
}

/**
 * 404 - Not found
 */
export class NotFoundError {
  constructor (target = 'Model', results = null) {
    this.content = { results, message: `${target} not found` }
  }
}

/**
 * 409 - Conflict
 */
export class ConflictError {
  constructor (message, results = null) {
    this.content = { results, message }
  }
}

/**
 * 503 - Service unavailable
 */
export class ServiceError {
  constructor (message, results = null) {
    this.content = { message, results }
  }
}

/**
 * Used to stop the pipeline
 */
export class StopPipeline {
  constructor (content) {
    this.content = content
  }
}

/**
 * Render the appropriate error
 */
export const renderConnectorError = (res, err) => {
  if (res.headersSent) { return }

  if (err instanceof StopPipeline) {
    return renderStopPipeline(res, err.content)
  }

  if (err instanceof NotFoundError) {
    return renderNotFound(res, err.content)
  } else if (err instanceof BadRequestError) {
    return renderBadRequest(res, err.content)
  } else if (err instanceof ForbiddenError) {
    return renderForbidden(res, err.content)
  } else if (err instanceof UnauthorizedError) {
    return renderUnauthorized(res, err.content)
  } else if (err instanceof ConflictError) {
    return renderConflict(res, err.content)
  } else if (err instanceof ServiceError) {
    return renderServiceUnavailable(res, err.content)
  }

  Logger.error('Internal server error', (err && err.stack) || (err && err.message) || err)
  return renderInternalServerError(res, err)
}
