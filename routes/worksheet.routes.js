// const express = require('express');
// const router = express.Router();
// const worksheetController = require('../controllers/worksheet.controller');
// const { protect } = require('../middleware/auth.middleware');

// // All worksheet routes require authentication
// router.use(protect);

// // Options endpoints
// router.get('/staff-options', worksheetController.getStaffOptions);
// router.get('/project-options', worksheetController.getProjectOptions);

// // Statistics endpoint
// router.get('/stats', worksheetController.getWorksheetStats);

// // Employee and project specific endpoints
// router.get('/employee/:empId', worksheetController.getWorksheetsByEmployee);
// router.get('/project/:projectName', worksheetController.getWorksheetsByProject);

// // Main CRUD endpoints
// router.get('/', worksheetController.getAllWorksheets);
// router.get('/:id', worksheetController.getWorksheetById);
// router.post('/', worksheetController.createWorksheet);
// router.put('/:id', worksheetController.updateWorksheet);
// router.delete('/:id', worksheetController.deleteWorksheet);

// module.exports = router;




const express = require('express');
const router = express.Router();
const worksheetController = require('../controllers/worksheet.controller');
// const { protect } = require('../middleware/auth.middleware');

// All worksheet routes require authentication
// router.use(protect);

// ==================== STATISTICS & OPTIONS ====================
router.get('/stats', worksheetController.getWorksheetStats);
router.get('/staff-options', worksheetController.getStaffOptions);
router.get('/project-options', worksheetController.getProjectOptions);

// ==================== EMPLOYEE & PROJECT SPECIFIC ====================
router.get('/employee/:empId', worksheetController.getWorksheetsByEmployee);
router.get('/project/:projectName', worksheetController.getWorksheetsByProject);

// ==================== EXPORT ====================
router.post('/export', worksheetController.exportWorksheets);

// ==================== MAIN CRUD ====================
router.get('/', worksheetController.getAllWorksheets);
router.get('/:id', worksheetController.getWorksheetById);
router.post('/', worksheetController.createWorksheet);
router.put('/:id', worksheetController.updateWorksheet);
router.delete('/:id', worksheetController.deleteWorksheet);

module.exports = router;