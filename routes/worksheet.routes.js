const express = require('express');
const router = express.Router();
const worksheetController = require('../controllers/worksheet.controller');

// ==================== STATISTICS & OPTIONS ====================
router.get('/stats', worksheetController.getWorksheetStats);
router.get('/staff-options', worksheetController.getStaffOptions);
router.get('/project-options', worksheetController.getProjectOptions);

// ==================== EMPLOYEE & PROJECT SPECIFIC ====================
router.get('/employee/:empId', worksheetController.getWorksheetsByEmployee);
router.get('/project/:projectName', worksheetController.getWorksheetsByProject);

// ==================== TODAY'S WORKSHEETS ====================
router.get('/today/employee/:empId', worksheetController.getEmployeeTodayWorksheets);
router.get('/today/sheet/:sheet', worksheetController.getTodayWorksheetsBySheet);
router.get('/today/all', worksheetController.getAllTodayWorksheets);

// ==================== EXPORT ====================
router.post('/export', worksheetController.exportWorksheets);

// ==================== MAIN CRUD ====================
router.get('/', worksheetController.getAllWorksheets);
router.get('/:id', worksheetController.getWorksheetById);
router.post('/', worksheetController.createWorksheet);
router.put('/:id', worksheetController.updateWorksheet);
router.delete('/:id', worksheetController.deleteWorksheet);

module.exports = router;