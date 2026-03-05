const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

// All dashboard routes require authentication
router.use(protect);

// Individual endpoints
router.get('/counts', dashboardController.getCounts);
router.get('/projects', dashboardController.getProjects);
router.get('/staff', dashboardController.getStaff);
router.get('/deadlines', dashboardController.getDeadlines);
router.get('/stats', dashboardController.getStats);

// Complete dashboard data (all in one)
router.get('/', dashboardController.getDashboardData);

module.exports = router;