const express = require('express');
const router = express.Router();

const { 
  staffCreationFields, 
  uploadDocuments       
} = require('../middleware/upload.config.js');

const {
  createStaff, 
  getAllStaff, 
  getStaffOptions,
  getMetadata, 
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
  deleteBatch
} = require('../controllers/staff.controller.js');

router.post('/create', staffCreationFields, createStaff);


router.get('/metadata', getMetadata);

// STAFF ROUTES
router.get('/all', getAllStaff);
router.get('/options', getStaffOptions);
router.get('/:employeeId', getStaffByEmployeeId);
router.put('/:employeeId',staffCreationFields, updateStaff);
router.delete('/:employeeId', deleteStaff);
router.patch('/:employeeId/toggle-status', toggleStaffStatus);


// DOCUMENT ROUTES
router.post('/documents/upload/:employeeId', uploadDocuments.array('documents', 10), uploadDocumentsController);
router.get('/documents/employee/:employeeId', getDocumentsByEmployeeId);
router.get('/documents/batch/:batchId', getDocumentsByBatchId);
router.get('/documents/type/:searchTerm', getDocumentsByType);
router.get('/documents/date-range', getDocumentsByDateRange);
router.get('/documents/stats/:employeeId', getDocumentStats);
router.delete('/documents/:documentId', deleteDocument);
router.delete('/documents/employee/:employeeId', deleteAllEmployeeDocuments);
router.delete('/documents/batch/:batchId', deleteBatch);


module.exports = router;