export const renderOk = (res, content) => {
  return res.status(200).json(content)
}

export const renderCreated = (res, content) => {
  return res.status(201).json(content)
}

export const renderDeleted = (res, message) => {
  return res.status(200).json({
    results: null,
    message,
  })
}

export const renderPolledMessages = (res, messages, waitTime) => {
  return res.status(200).json({
    message: `${messages.length} messages`,
    results: {
      messages,
      waitTime,
    },
  })
}
