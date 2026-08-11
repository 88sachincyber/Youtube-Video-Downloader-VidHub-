const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getProfile } = require('../controllers/userController');
const { apiLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.get('/profile', apiLimiter, authMiddleware, getProfile);

module.exports = router;
