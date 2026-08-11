const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendError, sendSuccess } = require('../utils/apiResponse');

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  return sendSuccess(res, user, 'Profile fetched successfully');
});

module.exports = {
  getProfile,
};
