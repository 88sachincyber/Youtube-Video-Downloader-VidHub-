const express = require('express');
const { query } = require('express-validator');
const { listPrograms, getRecommendations } = require('../controllers/programController');
const validateRequest = require('../middleware/validateRequest');
const authMiddleware = require('../middleware/authMiddleware');
const cacheMiddleware = require('../middleware/cacheMiddleware');
const { apiLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get(
  '/',
  apiLimiter,
  cacheMiddleware(),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  ],
  validateRequest,
  listPrograms
);

router.get(
  '/recommendations',
  apiLimiter,
  authMiddleware,
  cacheMiddleware(),
  [
    query('budget').optional().isFloat({ min: 0 }).withMessage('budget must be non-negative'),
    query('ieltsScore').optional().isFloat({ min: 0, max: 9 }).withMessage('ieltsScore must be between 0 and 9'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  ],
  validateRequest,
  getRecommendations
);

module.exports = router;
