const Application = require('../../models/Application');
const RecruitmentDrive = require('../../models/RecruitmentDrive');
const Membership = require('../../models/Membership');
const Club = require('../../models/Club');
const AppError = require('../../utils/AppError');
const { isAcceptingApplications } = require('./drive.service');

// Checks that every required field defined on the drive's form has a
// non-empty matching response. Deliberately simple (no per-type
// validation like "must be a number") — this is a college club
// platform, not a form-builder product; strict required/optional
// coverage is the part that actually prevents bad submissions.
function validateResponsesAgainstForm(formFields, responses) {
  const responseMap = new Map(responses.map((r) => [r.field, r.value]));
  const missing = formFields
    .filter((f) => f.required)
    .filter((f) => !responseMap.get(f.label)?.trim())
    .map((f) => f.label);

  if (missing.length > 0) {
    throw new AppError(`Missing required field(s): ${missing.join(', ')}`, 422);
  }
}

async function submitApplication(driveId, applicantId, { responses, resumeUrl }) {
  const drive = await RecruitmentDrive.findById(driveId);
  if (!drive) {
    throw new AppError('Recruitment drive not found', 404);
  }

  if (!isAcceptingApplications(drive)) {
    throw new AppError('This recruitment drive is not currently accepting applications', 400);
  }

  validateResponsesAgainstForm(drive.formFields, responses);

  try {
    const application = await Application.create({
      drive: driveId,
      club: drive.club,
      applicant: applicantId,
      responses,
      resumeUrl,
    });
    return application;
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('You have already applied to this drive', 409);
    }
    throw err;
  }
}

async function listApplicationsForDrive(driveId, { status, page = 1, limit = 20 } = {}) {
  const filter = { drive: driveId };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('applicant', 'name email department year skills avatarUrl')
      .skip(skip)
      .limit(Number(limit))
      .sort({ submittedAt: -1 }),
    Application.countDocuments(filter),
  ]);

  return {
    applications,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  };
}

async function getApplicationById(id) {
  const application = await Application.findById(id)
    .populate('applicant', 'name email department year skills avatarUrl')
    .populate('drive', 'title openDate closeDate')
    .populate('club', 'name slug');

  if (!application) {
    throw new AppError('Application not found', 404);
  }
  return application;
}

// Adds the applicant as an active club member without throwing if
// they're already one — acceptance can happen more than once in edge
// cases (e.g. a status is corrected), and that shouldn't be an error.
// Kept local to this module rather than calling into club.service's
// addMember (which intentionally throws on duplicates for the manual
// "coordinator adds a member" flow) to keep the two call sites' error
// semantics independent.
async function ensureActiveMembership(clubId, userId) {
  const existing = await Membership.findOne({ club: clubId, user: userId });

  if (existing && existing.status === 'active') return;

  if (existing) {
    existing.status = 'active';
    existing.joinedAt = new Date();
    await existing.save();
  } else {
    await Membership.create({ club: clubId, user: userId });
  }

  await Club.findByIdAndUpdate(clubId, { $inc: { memberCount: 1 } });
}

async function updateApplicationStatus(application, { status, reviewNotes }, reviewerId) {
  application.status = status;
  application.reviewedBy = reviewerId;
  if (reviewNotes !== undefined) application.reviewNotes = reviewNotes;
  await application.save();

  if (status === 'accepted') {
    await ensureActiveMembership(application.club, application.applicant);
  }

  return application;
}

async function listApplicationsForUser(userId, { status, page = 1, limit = 20 } = {}) {
  const filter = { applicant: userId };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('drive', 'title openDate closeDate status')
      .populate('club', 'name slug logoUrl')
      .skip(skip)
      .limit(Number(limit))
      .sort({ submittedAt: -1 }),
    Application.countDocuments(filter),
  ]);

  return {
    applications,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  };
}

module.exports = {
  validateResponsesAgainstForm,
  submitApplication,
  listApplicationsForDrive,
  getApplicationById,
  updateApplicationStatus,
  listApplicationsForUser,
};
