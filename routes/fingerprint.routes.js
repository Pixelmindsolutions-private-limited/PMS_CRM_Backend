const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fingerprintController = require('../controllers/fingerprint.controller');
const { protect } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/fingerprints/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `fp_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter - only accept images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'image/wsq'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Rate limiting for biometric endpoints (more strict)
const biometricLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    success: false,
    message: 'Too many fingerprint attempts, please try again after 15 minutes'
  }
});

// All routes require authentication
router.use(protect);

// Apply stricter rate limiting to biometric operations
router.use('/enroll', biometricLimiter);
router.use('/verify', biometricLimiter);
router.use('/identify', biometricLimiter);

/**
 * Enrollment endpoints
 */

// Start enrollment session for multiple fingers
router.post('/enrollment/start', fingerprintController.startEnrollmentSession);

// Enroll single fingerprint (with session support)
router.post(
  '/enroll',
  upload.single('fingerprintImage'),
  fingerprintController.enrollFingerprint
);

// Enroll multiple fingerprints in batch (up to 6 fingers)
router.post(
  '/enroll-batch',
  upload.array('fingerprintImages', 6),
  fingerprintController.enrollMultipleFingers
);

/**
 * Verification and identification endpoints
 */

// Verify fingerprint (1:1 verification)
router.post(
  '/verify',
  upload.single('fingerprintImage'),
  fingerprintController.verifyFingerprint
);

// Identify staff from fingerprint (1:N identification)
router.post(
  '/identify',
  upload.single('fingerprintImage'),
  fingerprintController.identifyStaff
);

/**
 * Management endpoints
 */

// Get all fingerprints for a staff
router.get('/staff/:staffId', fingerprintController.getStaffFingerprints);

// Delete specific fingerprint
router.delete('/:fingerprintId', fingerprintController.deleteFingerprint);

// Update fingerprint status (activate/deactivate)
router.patch('/:fingerprintId/status', fingerprintController.updateFingerprintStatus);

/**
 * Utility endpoints
 */

// Check fingerprint quality without enrolling
router.post(
  '/check-quality',
  upload.single('fingerprintImage'),
  fingerprintController.checkFingerprintQuality
);

// Get fingerprint statistics
router.get('/stats', fingerprintController.getFingerprintStats);

module.exports = router;