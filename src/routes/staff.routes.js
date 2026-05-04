// const express = require('express');
// const router = express.Router();
// const staffController = require('../controllers/staff.controller');
// const { protect } = require('../middleware/auth.middleware');

// // All staff routes require authentication
// router.use(protect);

// // Staff routes matching your Flutter model
// router.post('/', staffController.createStaff);              // Create staff
// router.get('/options', staffController.getStaffOptions);    // For dropdowns
// router.get('/', staffController.getAllStaff);                // Get all staff
// router.get('/:id', staffController.getStaffById);            // Get single staff
// router.put('/:id', staffController.updateStaff);             // Update staff
// router.delete('/:id', staffController.deleteStaff);          // Delete staff
// router.patch('/:id/toggle-status', staffController.toggleStatus); // Toggle active status

// module.exports = router;




const express = require('express');
const router = express.Router();

// ✅ Import from upload config ONLY
const { uploadArray } = require('../middleware/upload.config');

const {
  createStaff, getAllStaff, getStaffOptions, getStaffByEmployeeId,
  updateStaff, deleteStaff, toggleStaffStatus,
  uploadDocuments, getDocumentsByEmployeeId, getDocumentsByBatchId,
  getDocumentsByType, getDocumentsByDateRange,
  getDocumentStats, deleteDocument, deleteAllEmployeeDocuments, deleteBatch
} = require('../controllers/staff.controller.js');


// STAFF ROUTES
router.post('/create', createStaff);
router.get('/all', getAllStaff);
router.get('/options', getStaffOptions);
router.get('/:employeeId', getStaffByEmployeeId);
router.put('/:employeeId', updateStaff);
router.delete('/:employeeId', deleteStaff);
router.patch('/:employeeId/toggle-status', toggleStaffStatus);

// DOCUMENT ROUTES - Use import from config
router.post('/documents/upload/:employeeId', uploadArray, uploadDocuments);
router.get('/documents/employee/:employeeId', getDocumentsByEmployeeId);
router.get('/documents/batch/:batchId', getDocumentsByBatchId);
router.get('/documents/type/:searchTerm', getDocumentsByType);
router.get('/documents/date-range', getDocumentsByDateRange);
router.get('/documents/stats/:employeeId', getDocumentStats);
router.delete('/documents/:documentId', deleteDocument);
router.delete('/documents/employee/:employeeId', deleteAllEmployeeDocuments);
router.delete('/documents/batch/:batchId', deleteBatch);

module.exports = router;