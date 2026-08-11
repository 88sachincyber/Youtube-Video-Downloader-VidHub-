const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authorization token is required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token', 401);
  }
};

module.exports = authMiddleware;
