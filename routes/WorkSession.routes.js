const express = require('express');
const router = express.Router();
const { protect, staffOnly, adminOnly } = require('../middleware/auth.middleware');
const {
  startWork, updateActivity, reportIdle, checkIdleStatus, handleIdleResponse,
  startBreak, endBreak, endWork, getTodaySummary, getWorkHistory, getActiveEmployees,
  getAllSessions, getAllSessionsAdmin, getTodayTimeline, getCurrentStatus
} = require('../controllers/WorkSession.controller');

// Authenticated staff identity is authoritative for all self-service work APIs.
const ownStaffId = (req, res, next) => {
  const id = String(req.user.employeeId);
  req.params.employeeId = id;
  req.body.employeeId = id;
  next();
};
router.use(protect);
router.post('/start', staffOnly, ownStaffId, startWork);
router.post('/heartbeat', staffOnly, ownStaffId, updateActivity);
router.get('/check-idle/:employeeId', staffOnly, ownStaffId, checkIdleStatus);
router.post('/handle-idle', staffOnly, ownStaffId, handleIdleResponse);
router.post('/report-idle', staffOnly, ownStaffId, reportIdle);
router.post('/start-break', staffOnly, ownStaffId, startBreak);
router.post('/break', staffOnly, ownStaffId, startBreak);
router.post('/end-break', staffOnly, ownStaffId, endBreak);
router.post('/resume', staffOnly, ownStaffId, endBreak);
router.post('/end-work', staffOnly, ownStaffId, endWork);
router.post('/end', staffOnly, ownStaffId, endWork);
router.get('/summary/:employeeId', staffOnly, ownStaffId, getTodaySummary);
router.get('/history/:employeeId', staffOnly, ownStaffId, getWorkHistory);
router.get('/all-sessions/:employeeId', staffOnly, ownStaffId, getAllSessions);
router.get('/timeline/:employeeId', staffOnly, ownStaffId, getTodayTimeline);
router.get('/current-status/:employeeId', staffOnly, ownStaffId, getCurrentStatus);
router.get('/session-status', staffOnly, ownStaffId, getCurrentStatus);
router.get('/reminder-status', staffOnly, ownStaffId, getCurrentStatus);
router.get('/active-employees', adminOnly, getActiveEmployees);
router.get('/all-sessions', (req, res, next) => {
  if (req.user.type === 'admin') {
    return getAllSessionsAdmin(req, res, next);
  }
  if (req.user.type === 'staff') {
    req.params.employeeId = String(req.user.employeeId);
    return getAllSessions(req, res, next);
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied.'
  });
});
module.exports = router;
