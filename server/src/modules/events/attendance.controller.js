const catchAsync = require('../../utils/catchAsync');
const { success } = require('../../utils/apiResponse');
const attendanceService = require('./attendance.service');

const createSession = catchAsync(async (req, res) => {
  const session = await attendanceService.createSession(req.params.eventId, req.user._id);
  return success(res, 201, { session }, 'Attendance session created');
});

const markAttendance = catchAsync(async (req, res) => {
  const log = await attendanceService.markAttendance(req.body.code, req.user._id);
  return success(res, 201, { log }, 'Attendance marked successfully');
});

const markManualAttendance = catchAsync(async (req, res) => {
  const log = await attendanceService.markManualAttendance(req.params.eventId, req.params.userId);
  return success(res, 201, { log }, 'Attendance marked successfully');
});

const listAttendanceForEvent = catchAsync(async (req, res) => {
  const logs = await attendanceService.listAttendanceForEvent(req.params.eventId);
  return success(res, 200, { logs }, 'Attendance fetched successfully');
});

module.exports = { createSession, markAttendance, markManualAttendance, listAttendanceForEvent };
