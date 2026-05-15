


const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/fingerprints',
    'uploads/temp',
    'uploads/staff/profile',     // ✅ Add this
    'uploads/staff/idcards',      // ✅ Add this
    'uploads/staff/documents'     // ✅ Add this
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

// ==================== STAFF CREATION UPLOAD (NEW) ====================
// This is for creating new staff where employeeId doesn't exist yet
const staffCreationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store in temp directory first   
    let uploadPath = 'uploads/temp/';
    
    // Categorize based on field name
    if (file.fieldname === 'profileImage') {
      uploadPath = 'uploads/staff/profile/';
    } else if (file.fieldname === 'idCardImage') {
      uploadPath = 'uploads/staff/idcards/';
    } else if (file.fieldname === 'documents') {
      uploadPath = 'uploads/temp/'; // Temp storage until employeeId is known
    }
    
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const cleanName = file.originalname.replace(/\s/g, '_');
    // Use a temporary filename pattern
    cb(null, `temp_${timestamp}_${random}_${cleanName}`);
  }
});

// File filter for staff creation
const staffCreationFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images and PDFs are allowed.`), false);
  }
};

// Staff creation upload middleware (handles all files at once)
const uploadStaffCreation = multer({
  storage: staffCreationStorage,
  fileFilter: staffCreationFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 25 // Max 25 files total
  }
});

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

// ==================== EXPORT ALL ====================
module.exports = {
  // Staff creation (NEW - for creating new staff)
  uploadStaffCreation,
  staffCreationFields: uploadStaffCreation.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'idCardImage', maxCount: 1 },
    { name: 'documents', maxCount: 20 }
  ]),
  
  // Document upload (for existing staff)
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