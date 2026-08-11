const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return sendError(
      res,
      'Validation failed',
      400,
      errors.array().map((error) => ({ field: error.path, message: error.msg }))
    );
  }

  return next();
};

module.exports = validateRequest;
