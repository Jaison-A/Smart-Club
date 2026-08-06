const RecruitmentDrive = require('../../models/RecruitmentDrive');
const AppError = require('../../utils/AppError');

// A drive accepts applications only when a coordinator has explicitly
// opened it AND the current date falls within its window. Both
// conditions matter: status lets a coordinator manually pause/close
// early; the date window prevents a forgotten "open" drive from
// silently accepting applications forever.
function isAcceptingApplications(drive) {
  const now = new Date();
  return drive.status === 'open' && now >= drive.openDate && now <= drive.closeDate;
}

async function createDrive(clubId, payload, creatorId) {
  const drive = await RecruitmentDrive.create({
    ...payload,
    club: clubId,
    createdBy: creatorId,
    // Auto-open if the window already includes "now" at creation time,
    // otherwise leave it upcoming until the coordinator opens it (or
    // the openDate arrives and they open it manually).
    status: new Date() >= new Date(payload.openDate) ? 'open' : 'upcoming',
  });

  return drive;
}

async function listDrivesForClub(clubId, { status, page = 1, limit = 20 } = {}) {
  const filter = { club: clubId };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [drives, total] = await Promise.all([
    RecruitmentDrive.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    RecruitmentDrive.countDocuments(filter),
  ]);

  return {
    drives,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  };
}

async function getDriveById(driveId) {
  const drive = await RecruitmentDrive.findById(driveId).populate('club', 'name slug logoUrl');
  if (!drive) {
    throw new AppError('Recruitment drive not found', 404);
  }
  return drive;
}

async function updateDrive(drive, updates) {
  Object.assign(drive, updates);
  await drive.save();
  return drive;
}

module.exports = {
  isAcceptingApplications,
  createDrive,
  listDrivesForClub,
  getDriveById,
  updateDrive,
};
