const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/fingerprints',
    'uploads/temp'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage
const fingerprintStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/fingerprints/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `fp_${timestamp}_${random}${ext}`);
  }
});

// File filter for fingerprint images
const fingerprintFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/bmp', 
    'image/tiff', 
    'image/x-wsq', // FBI WSQ format
    'application/octet-stream' // Raw fingerprint data
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only fingerprint image formats are allowed.'), false);
  }
};

// Export configured upload middleware
const uploadFingerprint = multer({
  storage: fingerprintStorage,
  fileFilter: fingerprintFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for high-res fingerprints
  }
});

module.exports = {
  uploadFingerprint,
  uploadSingle: uploadFingerprint.single('fingerprintImage'),
  uploadMultiple: uploadFingerprint.array('fingerprintImages', 6)
};