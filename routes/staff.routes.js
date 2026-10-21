const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for face uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'face_' + uniqueSuffix + '.jpg');
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const { 
  staffCreationFields, 
  uploadDocuments       
} = require('../middleware/upload.config');

const {
  createStaff, 
  getAllStaff, 
  getStaffOptions,
  getMetadata, 
  verifyFace,
  checkFaceHealth,
  getStaffByEmployeeId,
  updateStaff, 
  deleteStaff, 
  toggleStaffStatus,
  uploadDocuments: uploadDocumentsController, 
  getDocumentsByEmployeeId, 
  getDocumentsByBatchId,
  getDocumentsByType, 
  getDocumentsByDateRange,
  getDocumentStats, 
  deleteDocument, 
  deleteAllEmployeeDocuments, 
  deleteBatch,
  staffLogin,
  staffLogout,
  refreshStaffToken,
  generateStaffToken,
  getStaffProfile,
  changeStaffPassword,
  getAllSessions ,
  getBreakSummary,
  getBreakHistory,
  getEmployeeSessionTracking,
  getWorkSalaryReport,

} = require('../controllers/staff.controller');

const { protect, staffOnly } = require('../middleware/auth.middleware');

// ==================== PUBLIC ROUTES (No Auth Required) ====================
router.post('/login', staffLogin);

// ==================== FACE VERIFICATION ROUTES ====================
// ✅ MUST COME BEFORE ANY PARAMETER ROUTES
router.post('/verify-face', upload.single('capturedFace'), verifyFace);
router.get('/face-health', checkFaceHealth);

// ==================== STAFF CRUD ROUTES ====================
router.post('/create', staffCreationFields, createStaff);
router.get('/metadata', getMetadata);
router.get('/all', getAllStaff);
router.get("/work-salary-report", getWorkSalaryReport);
router.get('/all-sessions', getAllSessions);
router.get('/break-summary',  getBreakSummary);
router.get('/break-history', getBreakHistory);
router.get('/employee-sessions/:employeeId', getEmployeeSessionTracking);
router.get('/options', getStaffOptions);



// ==================== PROTECTED ROUTES (Auth Required) ====================
router.get('/profile', protect, staffOnly, getStaffProfile);
router.post('/change-password', protect, staffOnly, changeStaffPassword);
router.post('/logout', protect, staffOnly, staffLogout);
router.post('/refresh-token', protect, staffOnly, refreshStaffToken);

// ==================== PARAMETER ROUTES (MUST COME LAST) ====================
// ⚠️ These catch-all routes must be after all specific routes
router.get('/:employeeId', getStaffByEmployeeId);
router.put('/:employeeId', staffCreationFields, updateStaff);
router.delete('/:employeeId', deleteStaff);
router.patch('/:employeeId/toggle-status', toggleStaffStatus);

// ==================== DOCUMENT ROUTES ====================
router.post('/documents/upload/:employeeId', uploadDocuments.array('documents', 10), uploadDocumentsController);
router.get('/documents/:employeeId', getDocumentsByEmployeeId);
router.get('/documents/employee/:employeeId', getDocumentsByEmployeeId);
router.get('/documents/batch/:batchId', getDocumentsByBatchId);
router.get('/documents/type/:searchTerm', getDocumentsByType);
router.get('/documents/date-range', getDocumentsByDateRange);
router.get('/documents/stats/:employeeId', getDocumentStats);
router.delete('/documents/:documentId', deleteDocument);
router.delete('/documents/employee/:employeeId', deleteAllEmployeeDocuments);
router.delete('/documents/batch/:batchId', deleteBatch);

module.exports = router;