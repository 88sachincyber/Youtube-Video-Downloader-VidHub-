const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const validateObjectId = require('../middleware/validateObjectId');
const { apiLimiter } = require('../middleware/rateLimiters');
const {
  createApplication,
  updateApplicationStatus,
} = require('../controllers/applicationController');

const router = express.Router();

router.use(apiLimiter);
router.use(authMiddleware);

router.post(
  '/',
  [body('programId').notEmpty().withMessage('programId is required')],
  validateRequest,
  validateObjectId('programId'),
  createApplication
);

router.patch(
  '/:id/status',
  [
    body('status')
      .isIn(['Reviewed', 'Accepted', 'Rejected'])
      .withMessage('status must be one of Reviewed, Accepted, Rejected'),
  ],
  validateRequest,
  validateObjectId('id'),
  updateApplicationStatus
);

module.exports = router;
