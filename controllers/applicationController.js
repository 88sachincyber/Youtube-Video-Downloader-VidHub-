const Application = require('../models/Application');
const Program = require('../models/Program');
const mongoSanitize = require('mongo-sanitize');
const asyncHandler = require('../utils/asyncHandler');
const { sendError, sendSuccess } = require('../utils/apiResponse');

const VALID_TRANSITIONS = {
  Applied: ['Reviewed'],
  Reviewed: ['Accepted', 'Rejected'],
  Accepted: [],
  Rejected: [],
};

const createApplication = asyncHandler(async (req, res) => {
  const programId = mongoSanitize(req.body.programId);
  const note = mongoSanitize(req.body.note);

  const program = await Program.findById(programId);
  if (!program) {
    return sendError(res, 'Program not found', 404);
  }

  const exists = await Application.findOne({ user: req.user.id, program: programId });
  if (exists) {
    return sendError(res, 'You have already applied to this program', 409);
  }

  const application = await Application.create({
    user: req.user.id,
    program: programId,
    status: 'Applied',
    statusHistory: [{ status: 'Applied', note }],
  });

  return sendSuccess(res, application, 'Application created successfully', 201);
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const status = mongoSanitize(req.body.status);
  const note = mongoSanitize(req.body.note);
  const applicationId = mongoSanitize(req.params.id);

  const application = await Application.findOne({
    _id: applicationId,
    user: req.user.id,
  });

  if (!application) {
    return sendError(res, 'Application not found', 404);
  }

  const allowedNextStatuses = VALID_TRANSITIONS[application.status] || [];
  if (!allowedNextStatuses.includes(status)) {
    return sendError(
      res,
      `Invalid status transition from ${application.status} to ${status}`,
      400
    );
  }

  application.status = status;
  application.statusHistory.push({ status, note });
  await application.save();

  return sendSuccess(res, application, 'Application status updated successfully');
});

module.exports = {
  createApplication,
  updateApplicationStatus,
};
