const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/create-admin', authController.createAdmin);  // For Postman only
router.post('/send-otp', authController.sendOtp);         // For frontend
router.post('/verify-otp', authController.verifyOtp);     // For frontend

// Protected routes
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

module.exports = router;