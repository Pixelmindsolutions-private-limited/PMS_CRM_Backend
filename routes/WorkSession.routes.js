const express = require('express');
const router = express.Router();

const {
  startWork,
  updateActivity,
  reportIdle,
  checkIdleStatus,
  handleIdleResponse,
  startBreak,
  endWork,
  getTodaySummary,
  getWorkHistory,
  getActiveEmployees,
  getAllSessions,
  getAllSessionsAdmin,
  getTodayTimeline
} = require('../controllers/WorkSession.controller');

router.post('/start', startWork);
router.post('/heartbeat', updateActivity);
router.get('/check-idle/:employeeId', checkIdleStatus);
router.post('/handle-idle', handleIdleResponse);
router.post('/report-idle', reportIdle);
router.post('/start-break', startBreak);
router.post('/end-work', endWork);
router.get('/summary/:employeeId', getTodaySummary); 
router.get('/history/:employeeId', getWorkHistory);
router.get('/active-employees', getActiveEmployees);
router.get('/all-sessions/:employeeId', getAllSessions);
router.get('/all-sessions', getAllSessionsAdmin);
router.get('/timeline/:employeeId', getTodayTimeline);

module.exports = router;