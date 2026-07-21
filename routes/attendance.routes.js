const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { protect } = require('../middleware/auth.middleware');

// All attendance routes require authentication
// router.use(protect);

// Staff options for dropdown
router.get('/staff-options', attendanceController.getStaffOptions);

// Statistics
router.get('/stats', attendanceController.getAttendanceStats);

// Main CRUD routes
router.get('/', attendanceController.getAllAttendance);
router.get('/staff/:staffId', attendanceController.getAttendanceByStaff);
router.post('/', attendanceController.createAttendance);
router.post('/bulk', attendanceController.bulkCreateAttendance);
router.put('/:id', attendanceController.updateAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;