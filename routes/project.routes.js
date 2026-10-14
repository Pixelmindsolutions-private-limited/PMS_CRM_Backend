
// const express = require('express');
// const router = express.Router();
// const {
//   getProjectOptions,
//   createProject,
//   getAllProjects,
//   getProjectById,
//   updateProject,
//   deleteProject,
//   addMilestonePayment,
//   updateMilestonePayment,
//   deleteMilestonePayment,
//   addBudgetInstallment,
//   deleteBudgetInstallment,
//   addTeamMember,
//   removeTeamMember,
//   getProjectStats
// } = require('../controllers/project.controller');

// // ==================== STATISTICS & OPTIONS (MUST BE BEFORE PARAM ROUTES) ====================
// router.get('/stats', getProjectStats);
// router.get('/options', getProjectOptions);

// // ==================== MAIN CRUD ROUTES ====================
// router.post('/', createProject);
// router.get('/', getAllProjects);
// router.get('/:id', getProjectById);
// router.put('/:id', updateProject);
// router.delete('/:id', deleteProject);

// // ==================== MILESTONE PAYMENT ROUTES ====================
// router.post('/:id/milestones', addMilestonePayment);
// router.put('/:projectId/milestones/:milestoneId', updateMilestonePayment);
// router.delete('/:projectId/milestones/:milestoneId', deleteMilestonePayment);

// // ==================== BUDGET INSTALLMENT ROUTES ====================
// router.post('/:id/budget', addBudgetInstallment);
// router.delete('/:projectId/budget/:installmentId', deleteBudgetInstallment);

// // ==================== TEAM MEMBERS ROUTES ====================
// router.post('/:id/team', addTeamMember);
// router.delete('/:id/team/:role/:memberName', removeTeamMember);

// module.exports = router;


// // routes/projectRoutes.js
// const express = require('express');
// const router = express.Router();
// const {
//     createProject,
//     createMultipleProjects,
//     getAllProjects,
//     getProjectById,
//     getProjectOptions,
//     getProjectStats,
//     updateProject,
//     deleteProject,
//     bulkDeleteProjects,
//     restoreProject,
//     permanentDeleteProjects,

//     // Milestone Payment Routes
//     addInstallment,
//     markAsPaid,
//     editInstallment,
//     deleteInstallment,
//     getInstallments,

//     // Reminder Routes
//     sendReminders,
//     getUpcomingInstallments,
//     sendTestReminder,
//     getReminderStats,
//     getTomorrowReminders,
//     debugReminders,

//     // Invoice Routes
//     getInvoices,
//     getInvoiceStats,
//     getInvoicesByProject,
//     getInvoiceById
// } = require('../controllers/project.controller');



// router.get('/options', getProjectOptions);
// router.get('/stats', getProjectStats);



// // ==================== REMINDER ROUTES ====================
// router.post('/sendremainder', sendReminders);
// router.get('/upcominginstallments', getUpcomingInstallments);
// router.get('/tomorrow', getTomorrowReminders);
// router.post('/test/:projectId', sendTestReminder);
// router.get('/remainderstats', getReminderStats);
// router.get('/debugreminders', debugReminders);


// // ==================== CREATE ====================
// router.post('/create', createProject);
// router.get('/all', getAllProjects);
// router.delete('/delete', bulkDeleteProjects);
// router.delete('/permanent', permanentDeleteProjects);


// // ==================== INVOICE ROUTES ====================
// router.get('/invoices', getInvoices);
// router.get('/invoices/stats', getInvoiceStats);


// router.get('/:id', getProjectById);

// // ==================== UPDATE ====================
// router.put('/:id', updateProject);


// // ==================== DELETE ====================
// router.put('/:id/restore', restoreProject);


// // ==================== INSTALLMENT ROUTES ====================
// router.post('/:id/installments', addInstallment);
// router.put('/:id/installments/:installmentId/mark-paid', markAsPaid);
// router.put('/:id/installments/:installmentId', editInstallment);
// router.delete('/:id/installments/:installmentId', deleteInstallment);
// router.get('/:id/installments', getInstallments);


// module.exports = router;

// routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const {
    createProject,
    getAllProjects,
    getProjectById,
    getProjectOptions,
    getProjectStats,
    updateProject,
    deleteProject,
    bulkDeleteProjects,
    restoreProject,
    permanentDeleteProjects,
    addInstallment,
    markAsPaid,
    editInstallment,
    deleteInstallment,
    getInstallments,
    sendReminders,
    getUpcomingInstallments,
    sendTestReminder,
    getReminderStats,
    getTomorrowReminders,
    debugReminders,
    getInvoices,
    getInvoiceStats
} = require('../controllers/project.controller');

// ==================== STATISTICS & OPTIONS ====================
router.get('/stats', getProjectStats);
router.get('/options', getProjectOptions);

// ==================== REMINDER ROUTES ====================
router.post('/sendremainder', sendReminders);
router.get('/upcominginstallments', getUpcomingInstallments);
router.get('/tomorrow', getTomorrowReminders);
router.post('/test/:projectId', sendTestReminder);
router.get('/remainderstats', getReminderStats);
router.get('/debugreminders', debugReminders);

// ==================== INVOICE ROUTES ====================
router.get('/invoices', getInvoices);
router.get('/invoices/stats', getInvoiceStats);

// ==================== PROJECT CRUD ====================
router.post('/create', createProject);
router.get('/all', getAllProjects);
router.delete('/delete', bulkDeleteProjects);
router.delete('/permanent', permanentDeleteProjects);

// ==================== PROJECT BY ID ====================
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.put('/:id/restore', restoreProject);

// ==================== INSTALLMENT ROUTES ====================
router.post('/:id/installments', addInstallment);
router.put('/:id/installments/:installmentId/mark-paid', markAsPaid);
router.put('/:id/installments/:installmentId', editInstallment);
router.delete('/:id/installments/:installmentId', deleteInstallment);
router.get('/:id/installments', getInstallments);

module.exports = router;