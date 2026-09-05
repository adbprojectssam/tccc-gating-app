/*
 * <license header>
 */

/* Standard App Builder action helpers (trimmed to what get-project needs). */

/** Returns a log-safe stringification of params (hides the auth header). */
function stringParameters (params) {
  let headers = params.__ow_headers || {}
  if (headers.authorization) {
    headers = { ...headers, authorization: '<hidden>' }
  }
  return JSON.stringify({ ...params, __ow_headers: headers })
}

/** Names of required params/headers that are missing or empty. */
function getMissingKeys (obj, required) {
  return required.filter((r) => {
    const value = obj[r]
    return value === undefined || value === null || value === ''
  })
}

/** Validates required params and headers; returns an error message or null. */
function checkMissingRequestInputs (params, requiredParams = [], requiredHeaders = []) {
  let errorMessage = null
  const headers = params.__ow_headers || {}
  const missingHeaders = getMissingKeys(headers, requiredHeaders.map((h) => h.toLowerCase()))
  if (missingHeaders.length > 0) {
    errorMessage = `missing header(s) '${missingHeaders}'`
  }
  const missingParams = getMissingKeys(params, requiredParams)
  if (missingParams.length > 0) {
    errorMessage = `${errorMessage ? errorMessage + ' and ' : ''}missing parameter(s) '${missingParams}'`
  }
  return errorMessage
}

/** Shape returned to OpenWhisk for an error web response. */
function errorResponse (statusCode, message, logger) {
  if (logger && typeof logger.info === 'function') {
    logger.info(`${statusCode}: ${message}`)
  }
  return { error: { statusCode, body: { error: message } } }
}

module.exports = { errorResponse, stringParameters, checkMissingRequestInputs }
