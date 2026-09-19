const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const Certificate = require('../../models/Certificate');
const AttendanceLog = require('../../models/AttendanceLog');
const Event = require('../../models/Event');
const AppError = require('../../utils/AppError');

function generateCertificateId() {
  // Format: CERT-XXXXXXXX -- short, unique, and doesn't leak the Mongo
  // ObjectId in a public verification URL.
  return `CERT-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

// Requirement: certificates are only generated for valid attendees --
// enforced here by requiring a matching AttendanceLog to exist, not
// just trusting the caller.
async function generateForAttendee(eventId, userId, issuerId) {
  const attended = await AttendanceLog.exists({ event: eventId, user: userId });
  if (!attended) {
    throw new AppError('Cannot issue a certificate: no attendance record found for this student', 400);
  }

  const event = await Event.findById(eventId);
  if (!event) throw new AppError('Event not found', 404);

  const existing = await Certificate.findOne({ event: eventId, user: userId });
  if (existing) return existing;

  const certificate = await Certificate.create({
    event: eventId,
    club: event.club,
    user: userId,
    certificateId: generateCertificateId(),
    issuedBy: issuerId,
  });

  return certificate;
}

// Bulk-issues certificates for every attendee of an event who doesn't
// already have one. Skips (doesn't fail) attendees who are already
// issued a certificate, since re-running this after adding a few late
// attendance marks should be safe to repeat.
async function generateForAllAttendees(eventId, issuerId) {
  const event = await Event.findById(eventId);
  if (!event) throw new AppError('Event not found', 404);

  const logs = await AttendanceLog.find({ event: eventId });
  const results = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const log of logs) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Certificate.findOne({ event: eventId, user: log.user });
    if (existing) {
      results.push(existing);
      // eslint-disable-next-line no-continue
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const cert = await Certificate.create({
      event: eventId,
      club: event.club,
      user: log.user,
      certificateId: generateCertificateId(),
      issuedBy: issuerId,
    });
    results.push(cert);
  }

  return results;
}

async function listForUser(userId) {
  return Certificate.find({ user: userId })
    .populate('event', 'title startTime')
    .populate('club', 'name slug')
    .sort({ issuedAt: -1 });
}

async function getByCertificateId(certificateId) {
  const certificate = await Certificate.findOne({ certificateId })
    .populate('event', 'title startTime')
    .populate('club', 'name')
    .populate('user', 'name');
  if (!certificate) throw new AppError('Certificate not found', 404);
  return certificate;
}

// Certificate must belong to the requesting user, or be requested by
// the issuing club's coordinator/an admin -- enforced by the caller
// (controller/middleware). Public verification uses this same lookup
// since only name-level fields are populated, nothing sensitive.

// Renders the certificate as a PDF stream. Generated on demand at
// download time rather than stored as a file -- keeps the platform
// from needing binary storage infra just for this, and the content is
// fully deterministic from the DB record anyway.
function streamCertificatePdf(certificate, res) {
  const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${certificate.certificateId}.pdf"`);
  doc.pipe(res);

  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#153226');
  doc.fontSize(10).fillColor('#5B6B63').text('CERTIFICATE OF PARTICIPATION', 0, 90, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(28).fillColor('#153226').font('Helvetica-Bold').text('Certificate of Participation', { align: 'center' });
  doc.moveDown(1.5);
  doc.fontSize(14).fillColor('#14231C').font('Helvetica').text('This certifies that', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(22).fillColor('#153226').font('Helvetica-Bold').text(certificate.user.name, { align: 'center' });
  doc.moveDown(0.5);
  doc
    .fontSize(14)
    .fillColor('#14231C')
    .font('Helvetica')
    .text(`participated in "${certificate.event.title}" organized by ${certificate.club.name}`, {
      align: 'center',
    });
  doc.moveDown(0.3);
  doc
    .fontSize(11)
    .fillColor('#5B6B63')
    .text(new Date(certificate.event.startTime).toLocaleDateString(), { align: 'center' });

  doc.fontSize(9).fillColor('#5B6B63').text(`Certificate ID: ${certificate.certificateId}`, 60, doc.page.height - 90);
  doc
    .fontSize(9)
    .fillColor('#5B6B63')
    .text(`Verify at: /certificates/verify/${certificate.certificateId}`, 60, doc.page.height - 75);

  doc.end();
}

module.exports = {
  generateForAttendee,
  generateForAllAttendees,
  listForUser,
  getByCertificateId,
  streamCertificatePdf,
};
