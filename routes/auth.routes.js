const express = require('express');
const router = express.Router();
const adminController = require('../controllers/create-admin');
const { protect } = require('../middleware/auth.middleware');

// Public admin authentication routes. These handlers are implemented in
// controllers/create-admin.js; auth.controller.js is reserved for login sync.
router.post('/create-admin', adminController.createAdmin);
router.post('/send-otp', adminController.sendLoginOTP);
router.post('/verify-otp', adminController.verifyOTPAndLogin);

// Protected routes
router.get('/me', protect, (req, res) => {
  res.json({ success: true, data: req.user });
});
router.post('/logout', protect, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
