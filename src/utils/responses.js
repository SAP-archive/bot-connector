export const renderOk = (res, content) => {
  return res.status(200).json(content)
}

export const renderCreated = (res, content) => {
  return res.status(201).json(content)
}

export const renderDeleted = (res) => {
  return res.status(204).send()
}

export const renderBadRequest = (res, content) => {
  return res.status(400).json(content)
}

export const renderNotFound = (res, content) => {
  return res.status(404).json(content)
}

export const renderConflict = (res, content) => {
  return res.status(409).json(content)
}

export const renderInternalServerError = (res, content) => {
  return res.status(500).json(content)
}

export const renderServiceUnavailable = (res, content) => {
  return res.status(503).json(content)
}

export const renderStopPipeline = (res, content) => {
  return res.status(200).send(content)
}
