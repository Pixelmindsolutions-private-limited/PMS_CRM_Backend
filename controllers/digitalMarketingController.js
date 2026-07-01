// controllers/digitalMarketingController.js
const DigitalMarketingPlan = require('../models/DigitalMarketingPlan');

// ==================== CREATE PLAN ====================

// @desc    Create a new digital marketing plan
// @route   POST /api/digital-marketing/plans
exports.createPlan = async (req, res) => {
    try {
        const { planName, durations, features } = req.body;

        if (!planName || !durations || durations.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Plan name and durations are required'
            });
        }

        // Check if plan already exists
        const existingPlan = await DigitalMarketingPlan.findOne({ planName });
        if (existingPlan) {
            return res.status(400).json({
                success: false,
                message: 'Plan with this name already exists'
            });
        }

        const plan = new DigitalMarketingPlan({
            planName,
            durations,
            features: features || []
        });

        await plan.save();

        res.status(201).json({
            success: true,
            message: 'Plan created successfully',
            data: plan
        });
    } catch (error) {
        console.error('Create plan error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== GET ALL PLANS ====================

// @desc    Get all digital marketing plans
// @route   GET /api/digital-marketing/plans
exports.getAllPlans = async (req, res) => {
    try {
        const { isActive } = req.query;
        const query = {};

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const plans = await DigitalMarketingPlan.find(query)
            .sort({ planName: 1, createdAt: -1 });

        res.json({
            success: true,
            data: plans,
            total: plans.length
        });
    } catch (error) {
        console.error('Get all plans error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== GET PLAN BY ID ====================

// @desc    Get plan by ID
// @route   GET /api/digital-marketing/plans/:id
exports.getPlanById = async (req, res) => {
    try {
        const { id } = req.params;

        const plan = await DigitalMarketingPlan.findById(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        res.json({
            success: true,
            data: plan
        });
    } catch (error) {
        console.error('Get plan by ID error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== UPDATE PLAN ====================

// @desc    Update a digital marketing plan
// @route   PUT /api/digital-marketing/plans/:id
exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { planName, durations, features, isActive } = req.body;

        const plan = await DigitalMarketingPlan.findById(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        // Check if plan name already exists (excluding current plan)
        if (planName && planName !== plan.planName) {
            const existingPlan = await DigitalMarketingPlan.findOne({ planName });
            if (existingPlan) {
                return res.status(400).json({
                    success: false,
                    message: 'Plan with this name already exists'
                });
            }
            plan.planName = planName;
        }

        if (durations) plan.durations = durations;
        if (features) plan.features = features;
        if (isActive !== undefined) plan.isActive = isActive;

        await plan.save();

        res.json({
            success: true,
            message: 'Plan updated successfully',
            data: plan
        });
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== DELETE PLAN ====================

// @desc    Delete a digital marketing plan (Hard Delete)
// @route   DELETE /api/digital-marketing/plans/:id
exports.deletePlan = async (req, res) => {
    try {
        const { id } = req.params;

        const plan = await DigitalMarketingPlan.findByIdAndDelete(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        res.json({
            success: true,
            message: 'Plan deleted successfully',
            data: plan
        });
    } catch (error) {
        console.error('Delete plan error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== TOGGLE PLAN STATUS ====================

// @desc    Toggle plan active/inactive status
// @route   PUT /api/digital-marketing/plans/:id/toggle
exports.togglePlanStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const plan = await DigitalMarketingPlan.findById(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        plan.isActive = !plan.isActive;
        await plan.save();

        res.json({
            success: true,
            message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
            data: plan
        });
    } catch (error) {
        console.error('Toggle plan status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== GET ACTIVE PLANS ====================

// @desc    Get only active plans
// @route   GET /api/digital-marketing/plans/active
exports.getActivePlans = async (req, res) => {
    try {
        const plans = await DigitalMarketingPlan.find({ isActive: true })
            .sort({ planName: 1 });

        res.json({
            success: true,
            data: plans,
            total: plans.length
        });
    } catch (error) {
        console.error('Get active plans error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};