// routes/digitalMarketingRoutes.js
const express = require('express');
const router = express.Router();
const {
    createPlan,
    getAllPlans,
    getPlanById,
    updatePlan,
    deletePlan,
    togglePlanStatus,
    getActivePlans
} = require('../controllers/digitalMarketingController');

// ==================== PLAN ROUTES ====================

// Get active plans (must be before /:id)
router.get('/active', getActivePlans);

// CRUD operations
router.post('/createplan', createPlan);
router.get('/plans', getAllPlans);
router.get('/plan/:id', getPlanById);
router.put('/plan/:id', updatePlan);
router.delete('/plan/:id', deletePlan);
router.put('/plan/:id/toggle', togglePlanStatus);

module.exports = router;