const catchAsync = require('../../utils/catchAsync');
const { success } = require('../../utils/apiResponse');
const AppError = require('../../utils/AppError');
const Club = require('../../models/Club');
const certificateService = require('./certificate.service');

const generateForAttendee = catchAsync(async (req, res) => {
  const certificate = await certificateService.generateForAttendee(
    req.params.eventId,
    req.params.userId,
    req.user._id
  );
  return success(res, 201, { certificate }, 'Certificate generated');
});

const generateForAllAttendees = catchAsync(async (req, res) => {
  const certificates = await certificateService.generateForAllAttendees(req.params.eventId, req.user._id);
  return success(res, 201, { certificates }, `${certificates.length} certificate(s) generated`);
});

const listMyCertificates = catchAsync(async (req, res) => {
  const certificates = await certificateService.listForUser(req.params.id);
  return success(res, 200, { certificates }, 'Certificates fetched successfully');
});

// Public -- no auth required, per the spec's verification requirement.
// Only name-level fields are populated by the service, nothing private.
const verifyCertificate = catchAsync(async (req, res) => {
  const certificate = await certificateService.getByCertificateId(req.params.certificateId);
  return success(res, 200, { certificate }, 'Certificate verified');
});

// Download requires the certificate to belong to the requester, or the
// requester to be a coordinator of the issuing club / an admin.
const downloadCertificate = catchAsync(async (req, res, next) => {
  const certificate = await certificateService.getByCertificateId(req.params.certificateId);

  // Re-fetch with the raw user id (not populated) for the ownership check.
  const isOwner = certificate.user._id
    ? certificate.user._id.toString() === req.user._id.toString()
    : certificate.user.toString() === req.user._id.toString();

  if (!isOwner && req.user.role !== 'admin') {
    // Coordinators of the issuing club may also download -- checked via club lookup.
    const club = await Club.findById(certificate.club._id || certificate.club);
    const isCoordinator = club?.coordinators?.some((id) => id.toString() === req.user._id.toString());
    if (!isCoordinator) {
      return next(new AppError('You are not authorized to download this certificate', 403));
    }
  }

  certificateService.streamCertificatePdf(certificate, res);
});

module.exports = {
  generateForAttendee,
  generateForAllAttendees,
  listMyCertificates,
  verifyCertificate,
  downloadCertificate,
};
