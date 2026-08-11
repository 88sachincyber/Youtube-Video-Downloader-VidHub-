const jwt = require('jsonwebtoken');
const mongoSanitize = require('mongo-sanitize');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendError, sendSuccess } = require('../utils/apiResponse');

const createToken = (user) =>
  jwt.sign({ id: user._id.toString(), email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

const register = asyncHandler(async (req, res) => {
  const name = mongoSanitize(req.body.name);
  const email = mongoSanitize(req.body.email);
  const password = mongoSanitize(req.body.password);
  const preferences = mongoSanitize(req.body.preferences || {});

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 'Email is already registered', 409);
  }

  const user = await User.create({ name, email, password, preferences });

  return sendSuccess(
    res,
    {
      user,
      token: createToken(user),
    },
    'User registered successfully',
    201
  );
});

const login = asyncHandler(async (req, res) => {
  const email = mongoSanitize(req.body.email);
  const password = mongoSanitize(req.body.password);

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const userResponse = user.toObject();
  delete userResponse.password;

  return sendSuccess(res, { user: userResponse, token: createToken(user) }, 'Login successful');
});

module.exports = {
  register,
  login,
};
