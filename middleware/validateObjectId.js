const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');

const validateObjectId = (paramName) => (req, res, next) => {
  const value = req.params[paramName] || req.body[paramName];

  if (!mongoose.Types.ObjectId.isValid(value)) {
    return sendError(res, `Invalid ${paramName}`, 400);
  }

  return next();
};

module.exports = validateObjectId;
