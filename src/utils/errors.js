/**
 * Thrown when a resource is not found in db
 */
export class notFoundError {
  constructor (target) {
    this.target = target
  }
}

/**
 * Thrown when a channel is disable
 */
export class DisableError {
  constructor (target) {
    this.target = target
  }
}

/**
 * Thrown when there's a code error in Connector
 */
export class ConnectorError {
  constructor (message) {
    this.message = message
  }
}

/**
 * Thrown when a parameter is invalid
 */
export class ValidationError {
  constructor (target, action) {
    this.target = target
    this.action = action
  }
}

/**
 * Thrown by the validators, if an error is invalid
 */
export class FormatError {
  constructor (message) {
    this.message = message
  }
}

/**
 * Thrown to stop the pipeline flow
 * but it's not necessarily an error
 */
export class StopPipeline {
}

/**
 * Handle the differents types of error the Connector methods can throw
 */
export const handleMongooseError = (err, res, message) => {
  if (err instanceof notFoundError) {
    return res.status(404).json({ results: null, message: `${err.target} not found` })
  } else if (err instanceof ValidationError) {
    return res.status(400).json({ results: null, message: `Parameter ${err.target} is ${err.action}` })
  } else if (err instanceof FormatError) {
    return (res.status(400).json({ results: null, message: err.message }))
  } else if (err instanceof StopPipeline) {
    return res.status(200)
  } else if (err instanceof DisableError) {
    return res.status(400).json({ results: null, message: `${err.target} is disabled` })
  }
  res.status(500).json({ results: null, message })
}
