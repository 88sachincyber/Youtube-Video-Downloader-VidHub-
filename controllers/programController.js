const Program = require('../models/Program');
const User = require('../models/User');
const mongoSanitize = require('mongo-sanitize');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const ALLOWED_SORT_FIELDS = ['name', 'country', 'fieldOfStudy', 'intake', 'tuitionFee', 'minimumIelts', 'createdAt'];

const parseSort = (sortRaw) => {
  const sortValue = sortRaw || 'createdAt';
  const direction = sortValue.startsWith('-') ? -1 : 1;
  const field = sortValue.replace('-', '');

  if (!ALLOWED_SORT_FIELDS.includes(field)) {
    return null;
  }

  return { [field]: direction };
};

const listPrograms = asyncHandler(async (req, res) => {
  const country = mongoSanitize(req.query.country);
  const fieldOfStudy = mongoSanitize(req.query.fieldOfStudy);
  const intake = mongoSanitize(req.query.intake);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const sort = parseSort(mongoSanitize(req.query.sort));
  if (!sort) {
    return sendError(res, 'Invalid sort field', 400);
  }

  const query = {};

  if (country) {
    query.country = country;
  }
  if (fieldOfStudy) {
    query.fieldOfStudy = fieldOfStudy;
  }
  if (intake) {
    query.intake = intake;
  }

  const skip = (page - 1) * limit;

  const [programs, total] = await Promise.all([
    Program.find(query).sort(sort).skip(skip).limit(limit),
    Program.countDocuments(query),
  ]);

  return sendSuccess(
    res,
    programs,
    'Programs fetched successfully',
    200,
    {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  );
});

const getRecommendations = asyncHandler(async (req, res) => {
  let preferences = {
    preferredCountry: mongoSanitize(req.query.country),
    budget: req.query.budget ? Number(mongoSanitize(req.query.budget)) : undefined,
    fieldOfStudy: mongoSanitize(req.query.fieldOfStudy),
    intake: mongoSanitize(req.query.intake),
    ieltsScore: req.query.ieltsScore ? Number(mongoSanitize(req.query.ieltsScore)) : undefined,
  };

  if (req.user) {
    const user = await User.findById(req.user.id);
    if (user && user.preferences) {
      preferences = { ...preferences, ...user.preferences.toObject?.() };
    }
  }

  const limit = Number(req.query.limit) || 10;

  // Scoring strategy uses MongoDB aggregation for ranking:
  // +5 country match, +4 field match, +3 within budget, +2 intake match, +2 IELTS eligibility
  const pipeline = [
    {
      $addFields: {
        recommendationScore: {
          $add: [
            preferences.preferredCountry
              ? { $cond: [{ $eq: ['$country', preferences.preferredCountry] }, 5, 0] }
              : 0,
            preferences.fieldOfStudy
              ? { $cond: [{ $eq: ['$fieldOfStudy', preferences.fieldOfStudy] }, 4, 0] }
              : 0,
            preferences.budget
              ? { $cond: [{ $lte: ['$tuitionFee', preferences.budget] }, 3, 0] }
              : 0,
            preferences.intake ? { $cond: [{ $eq: ['$intake', preferences.intake] }, 2, 0] } : 0,
            preferences.ieltsScore
              ? { $cond: [{ $lte: ['$minimumIelts', preferences.ieltsScore] }, 2, 0] }
              : 0,
          ],
        },
      },
    },
    { $sort: { recommendationScore: -1, tuitionFee: 1 } },
    { $limit: limit },
  ];

  const programs = await Program.aggregate(pipeline);

  return sendSuccess(res, programs, 'Recommendations fetched successfully');
});

module.exports = {
  listPrograms,
  getRecommendations,
};
