const { sendError } = require('../utils/apiResponse');

const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => error.message);
    return sendError(res, 'Validation failed', 400, errors);
  }

  if (err.name === 'CastError') {
    return sendError(res, 'Invalid ID format', 400);
  }

  if (err.code === 11000) {
    return sendError(res, 'Duplicate value error', 409);
  }

  return sendError(res, err.message || 'Internal server error', err.statusCode || 500);
};

module.exports = errorMiddleware;
