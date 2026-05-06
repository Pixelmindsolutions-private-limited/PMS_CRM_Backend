// const express = require('express');
// const router = express.Router();
// const projectController = require('../controllers/project.controller');
// const { protect } = require('../middleware/auth.middleware');

// // All project routes require authentication
// router.use(protect);

// // Statistics route
// router.get('/stats', projectController.getProjectStats);

// // Options route (for dropdowns)
// router.get('/options', projectController.getProjectOptions);

// // Main CRUD routes
// router.get('/', projectController.getAllProjects);
// router.get('/:id', projectController.getProjectById);
// router.post('/', projectController.createProject);
// router.put('/:id', projectController.updateProject);
// router.delete('/:id', projectController.deleteProject);

// // Milestone payment routes
// router.post('/:id/milestones', projectController.addMilestonePayment);
// router.put('/:projectId/milestones/:milestoneId', projectController.updateMilestonePayment);
// router.delete('/:projectId/milestones/:milestoneId', projectController.deleteMilestonePayment);

// // Budget installment routes
// router.post('/:id/budget', projectController.addBudgetInstallment);
// router.delete('/:projectId/budget/:installmentId', projectController.deleteBudgetInstallment);

// module.exports = router;


const express = require('express');
const router = express.Router();
const {
  getProjectOptions,
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMilestonePayment,
  updateMilestonePayment,
  deleteMilestonePayment,
  addBudgetInstallment,
  deleteBudgetInstallment,
  addTeamMember,
  removeTeamMember,
  getProjectStats
} = require('../controllers/project.controller.js');

// ==================== STATISTICS & OPTIONS (MUST BE BEFORE PARAM ROUTES) ====================
router.get('/stats', getProjectStats);
router.get('/options', getProjectOptions);

// ==================== MAIN CRUD ROUTES ====================
router.post('/', createProject);
router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// ==================== MILESTONE PAYMENT ROUTES ====================
router.post('/:id/milestones', addMilestonePayment);
router.put('/:projectId/milestones/:milestoneId', updateMilestonePayment);
router.delete('/:projectId/milestones/:milestoneId', deleteMilestonePayment);

// ==================== BUDGET INSTALLMENT ROUTES ====================
router.post('/:id/budget', addBudgetInstallment);
router.delete('/:projectId/budget/:installmentId', deleteBudgetInstallment);

// ==================== TEAM MEMBERS ROUTES ====================
router.post('/:id/team', addTeamMember);
router.delete('/:id/team/:role/:memberName', removeTeamMember);

module.exports = router;