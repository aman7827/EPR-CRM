/**
 * Send a success response with single object payload
 */
export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

/**
 * Send a collection response with pagination metadata
 */
export const sendCollection = (res, data, meta, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    meta,
  });
};

/**
 * Send an error response
 */
export const sendError = (res, message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = null) => {
  const errorObj = {
    code,
    message,
  };
  if (details) {
    errorObj.details = details;
  }
  return res.status(statusCode).json({
    success: false,
    error: errorObj,
  });
};
