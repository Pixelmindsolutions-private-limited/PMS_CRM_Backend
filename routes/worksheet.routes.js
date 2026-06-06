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
router.post('/:worksheetId/project/:projectName/tasks', worksheetController.addTaskToProject);
router.put('/:worksheetId/project/:projectName/task/:taskId/status', worksheetController.updateTaskStatus);
router.delete('/:worksheetId/project/:projectName/task/:taskId', worksheetController.deleteTask);
router.post('/:worksheetId/project/:projectName/task/:taskId/comments', worksheetController.addTaskComment);
router.get('/employee/:empId/tasks', worksheetController.getEmployeeTasks);
router.get('/:worksheetId/project/:projectName/tasks', worksheetController.getProjectTasks);

// ==================== MAIN CRUD ====================
router.get('/', worksheetController.getAllWorksheets);
router.get('/:id', worksheetController.getWorksheetById);
router.post('/', worksheetController.createWorksheet);
router.put('/:id', worksheetController.updateWorksheet);
router.delete('/:id', worksheetController.deleteWorksheet);

module.exports = router;