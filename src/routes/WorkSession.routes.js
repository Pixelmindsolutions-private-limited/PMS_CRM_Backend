const express = require('express');
const router = express.Router();

const {
  startWork,
  updateActivity,
  checkIdleStatus,
  handleIdleResponse,
  startBreak,
  endWork,
  getTodaySummary,
  getWorkHistory,
  getAllSessions,
  getTodayTimeline
} = require('../controllers/WorkSession.controller');

router.post('/start', startWork);
router.post('/heartbeat', updateActivity);
router.get('/check-idle/:employeeId', checkIdleStatus);
router.post('/handle-idle', handleIdleResponse);
router.post('/start-break', startBreak);
router.post('/end-work', endWork);
router.get('/summary/:employeeId', getTodaySummary);
router.get('/history/:employeeId', getWorkHistory);
router.get('/all-sessions/:employeeId', getAllSessions);
router.get('/timeline/:employeeId', getTodayTimeline);

module.exports = router;