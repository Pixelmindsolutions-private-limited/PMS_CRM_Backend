const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Get absolute path helper
const getAbsolutePath = (relativePath) => {
  return path.join(__dirname, '..', relativePath);
};

// Ensure upload directories exist with absolute paths
const createUploadDirs = () => {
  const dirs = [
    getAbsolutePath('uploads/fingerprints'),
    getAbsolutePath('uploads/temp'),
    getAbsolutePath('uploads/staff/profile'),
    getAbsolutePath('uploads/staff/idcards'),
    getAbsolutePath('uploads/staff/documents')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

createUploadDirs();

// Ensure directory exists (helper function)
const ensureDir = (dir) => {
  const absolutePath = path.isAbsolute(dir) ? dir : path.join(__dirname, '..', dir);
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
  }
  return absolutePath;
};

// ==================== STAFF CREATION UPLOAD ====================
// const staffCreationStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let uploadPath = 'uploads/temp/';
    
//     if (file.fieldname === 'profileImage') {
//       uploadPath = getAbsolutePath('uploads/staff/profile/');
//     } else if (file.fieldname === 'idCardImage') {
//       uploadPath = getAbsolutePath('uploads/staff/idcards/');
//     } else if (file.fieldname === 'documents') {
//       uploadPath = getAbsolutePath('uploads/temp/');
//     }
    
//     ensureDir(uploadPath);
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const timestamp = Date.now();
//     const random = Math.round(Math.random() * 1E9);
//     const cleanName = file.originalname.replace(/\s/g, '_');
//     cb(null, `temp_${timestamp}_${random}_${cleanName}`);
//   }
// });

const staffCreationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ALWAYS save to temp first
    const uploadPath = getAbsolutePath('uploads/temp/');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const cleanName = file.originalname.replace(/\s/g, '_');
    cb(null, `temp_${timestamp}_${random}_${cleanName}`);
  }
});

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

const uploadStaffCreation = multer({
  storage: staffCreationStorage,
  fileFilter: staffCreationFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 25
  }
});

// ==================== FINGERPRINT STORAGE ====================
const fingerprintStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = getAbsolutePath('uploads/fingerprints/');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `fp_${timestamp}_${random}${ext}`);
  }
});

const fingerprintFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 
    'image/tiff', 'image/x-wsq', 'application/octet-stream'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only fingerprint image formats are allowed.'), false);
  }
};

const uploadFingerprint = multer({
  storage: fingerprintStorage,
  fileFilter: fingerprintFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ==================== DOCUMENT STORAGE ====================
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { employeeId } = req.params;
    const uploadDir = getAbsolutePath(`uploads/staff/documents/${employeeId}`);
    ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/\s/g, '_');
    cb(null, `${timestamp}_${cleanName}`);
  }
});

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

const uploadDocuments = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10
  }
});

// ==================== EXPORT ALL ====================
module.exports = {
  uploadStaffCreation,
  staffCreationFields: uploadStaffCreation.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'idCardImage', maxCount: 1 },
    { name: 'documents', maxCount: 20 }
  ]),
  
  uploadDocuments,
  uploadSingle: uploadDocuments.single('profileImage'),
  uploadArray: uploadDocuments.array('documents', 10),
  uploadFields: uploadDocuments.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
  ]),
  
  uploadFingerprint,
  uploadFingerprintSingle: uploadFingerprint.single('fingerprintImage'),
  uploadFingerprintMultiple: uploadFingerprint.array('fingerprintImages', 6)
};