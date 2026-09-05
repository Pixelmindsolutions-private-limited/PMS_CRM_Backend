// routes/adminAuthRoutes.js
const express = require('express');
const {
  createAdmin,
  sendLoginOTP,
  verifyOTPAndLogin,
  loginWithPassword,
  resendOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  getAdminProfile,
  getAllAdmins,
  updateAdmin,
  deleteAdmin
} = require('../controllers/create-admin');

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.post('/create', createAdmin);
router.post('/send-otp', sendLoginOTP);
router.post('/verify-otp', verifyOTPAndLogin);
router.post('/login', loginWithPassword);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ==================== PROTECTED ROUTES ====================
router.get('/profile/:adminId', getAdminProfile);
router.get('/all', getAllAdmins);
router.put('/update/:adminId', updateAdmin);
router.put('/change-password/:adminId', changePassword);
router.delete('/delete/:adminId', deleteAdmin);

module.exports = router;