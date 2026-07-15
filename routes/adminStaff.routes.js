// routes/adminStaffRoutes.js
const express = require('express');
const router = express.Router();
const StaffAccess = require('../models/AdminStaffLogin');

const {
    adminStaffLogin,
    getAdminStaffProfile,
    adminStaffLogout,
    getAllAdminStaff,
    getStaffAccess,
    toggleAdminStaffLogin,
    getAvailableStaff,
    getStaffByEmployeeId,
    assignStaffPermissions,
    updateStaffPermissions,
    getAllProjectsList
} = require('../controllers/adminStaff.controller');

// ============ PERMISSION MIDDLEWARE ============

// Check if staff has access to a module (for route protection)
const checkAdminModuleAccess = (moduleName) => {
    return async (req, res, next) => {
        try {
            const { staffId } = req.query;

            if (!staffId) {
                return res.status(400).json({
                    success: false,
                    message: 'Staff ID is required in query params'
                });
            }

            const staffAccess = await StaffAccess.findOne({ staffId });
            if (!staffAccess) {
                return res.status(404).json({
                    success: false,
                    message: 'Staff access record not found'
                });
            }

            if (!staffAccess.hasModuleAccess(moduleName)) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied: You don't have permission to access this module`
                });
            }

            if (staffAccess.isReadOnly && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
                return res.status(403).json({
                    success: false,
                    message: 'Read-only mode: You cannot make changes'
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };
};

// ============ MODULE CONFIGURATION ============

const MODULES = {
    DASHBOARD: 'dashboard',
    STAFF_MANAGEMENT: 'staffManagement',
    PROJECTS: 'projects',
    CLIENTS: 'clients',
    PAYMENTS: 'payments',
    INVOICES: 'invoices',
    REMINDERS: 'reminders',
    REPORTS: 'reports',
    SETTINGS: 'settings',
    ATTENDANCE: 'attendance',
    DIGITAL_MARKETING: 'digitalMarketing',
    WORKSHEETS: 'worksheets'
};

// ============ ROUTES ============

// ===== Public Routes =====
router.post('/login', adminStaffLogin);
router.post('/logout', adminStaffLogout);

// ===== Staff Lookup Routes =====
router.get('/available-staff', getAvailableStaff);
router.get('/by-employee/:employeeId', getStaffByEmployeeId);
router.get('/me', getAdminStaffProfile);

// ===== Staff Access Routes =====
router.get('/:id/access', getStaffAccess);

// ===== Admin Management Routes =====
router.post('/assign-permissions', assignStaffPermissions);
router.put('/update-permissions', updateStaffPermissions);
router.get('/', getAllAdminStaff);
router.put('/:id/toggle-login', toggleAdminStaffLogin);

router.get('/projectslist', getAllProjectsList);

module.exports = router;