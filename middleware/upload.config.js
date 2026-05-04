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

// Ensure directory exists (helper function)
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// ==================== FINGERPRINT STORAGE ====================
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

// Fingerprint upload middleware
const uploadFingerprint = multer({
  storage: fingerprintStorage,
  fileFilter: fingerprintFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for high-res fingerprints
  }
});

// ==================== DOCUMENT STORAGE ====================
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { employeeId } = req.params;
    const uploadDir = `uploads/staff/documents/${employeeId}`;
    ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/\s/g, '_');
    cb(null, `${timestamp}_${cleanName}`);
  }
});

// File filter for documents
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Document upload middleware
const uploadDocuments = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 10 // Max 10 files at once
  }
});
// After all your code, BEFORE module.exports
console.log('✅ upload.config loaded');
console.log('📁 uploadArray type:', typeof uploadDocuments.array('documents', 10));
// ==================== EXPORT ALL ====================
// ✅ SINGLE module.exports with all configurations
module.exports = {
  // Document upload (for staff documents)
  uploadDocuments,
  uploadSingle: uploadDocuments.single('profileImage'),
  uploadArray: uploadDocuments.array('documents', 10),
  uploadFields: uploadDocuments.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
  ]),
  
  // Fingerprint upload
  uploadFingerprint,
  uploadFingerprintSingle: uploadFingerprint.single('fingerprintImage'),
  uploadFingerprintMultiple: uploadFingerprint.array('fingerprintImages', 6)
};