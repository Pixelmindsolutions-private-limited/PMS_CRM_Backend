// controllers/adminStaffController.js
const Project  = require('../models/Project')
const { Staff } = require('../models/Staff');
const StaffAccess = require('../models/AdminStaffLogin');
const bcrypt = require('bcryptjs');

// ============ GET AVAILABLE STAFF ============

// @desc    Get available staff (without admin access) for dropdown
// @route   GET /api/admin-staff/available-staff
exports.getAvailableStaff = async (req, res) => {
    try {
        const allStaff = await Staff.find({ isActive: true })
            .select('employeeId employeeName email adminEmail role mobile profileImage')
            .sort({ employeeName: 1 });

        const accessRecords = await StaffAccess.find({}, 'staffId');
        const assignedStaffIds = accessRecords.map(a => a.staffId.toString());

        const availableStaff = allStaff.filter(
            s => !assignedStaffIds.includes(s._id.toString())
        );

        res.json({
            success: true,
            data: availableStaff,
            total: availableStaff.length
        });
    } catch (error) {
        console.error('Get available staff error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ ASSIGN ADMIN PANEL ACCESS ============

// @desc    Assign admin panel access to existing staff
// @route   POST /api/admin-staff/assign-permissions
exports.assignStaffPermissions = async (req, res) => {
    try {
        const { 
            employeeId,
            adminEmail,
            adminPanelPassword,
            modulePermissions,
            allowedProjects,
            isAllProjectsAllowed,
            isReadOnly
        } = req.body;

        // Validate required fields
        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required'
            });
        }

        if (!adminPanelPassword) {
            return res.status(400).json({
                success: false,
                message: 'Admin panel password is required'
            });
        }

        // Find staff
        const staff = await Staff.findOne({ employeeId, isActive: true });
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found with this employee ID'
            });
        }

        // Check if already has admin access
        const existingAccess = await StaffAccess.findOne({ staffId: staff._id });
        if (existingAccess) {
            return res.status(400).json({
                success: false,
                message: 'Staff already has admin panel access. Use update endpoint.'
            });
        }

        // Validate admin email if provided (must be unique)
        if (adminEmail) {
            const existingAdminEmail = await Staff.findOne({ 
                adminEmail: adminEmail.toLowerCase(),
                _id: { $ne: staff._id }
            });
            if (existingAdminEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Admin email already exists for another staff'
                });
            }
        }

        // Hash password and update staff
        const salt = await bcrypt.genSalt(10);
        const hashedAdminPassword = await bcrypt.hash(adminPanelPassword, salt);

        // Use provided adminEmail or default to staff's email
        staff.adminEmail = adminEmail ? adminEmail.toLowerCase() : staff.email;
        staff.adminPanelPassword = hashedAdminPassword;
        staff.isAdminPanelAccess = true;
        await staff.save();

        // Create access record
        const staffAccess = new StaffAccess({
            staffId: staff._id,
            employeeId: staff.employeeId,
            modulePermissions: modulePermissions || {
                dashboard: true,
                staffManagement: false,
                projects: false,
                clients: false,
                payments: false,
                invoices: false,
                reminders: false,
                reports: false,
                settings: false,
                attendance: true,
                digitalMarketing: false,
                worksheets: false
            },
            allowedProjects: allowedProjects || [],
            isAllProjectsAllowed: isAllProjectsAllowed || false,
            isReadOnly: isReadOnly || false,
            createdBy: req.body.adminId || null
        });

        await staffAccess.save();

        res.status(201).json({
            success: true,
            message: 'Admin panel access assigned successfully',
            data: {
                staffId: staff._id,
                employeeId: staff.employeeId,
                employeeName: staff.employeeName,
                email: staff.email,
                adminEmail: staff.adminEmail,
                hasAdminPanelPassword: !!staff.adminPanelPassword,
                isAdminPanelAccess: staff.isAdminPanelAccess,
                modulePermissions: staffAccess.modulePermissions,
                allowedProjects: staffAccess.allowedProjects,
                isAllProjectsAllowed: staffAccess.isAllProjectsAllowed,
                isReadOnly: staffAccess.isReadOnly,
                accessibleModules: staffAccess.getAccessibleModules()
            }
        });
    } catch (error) {
        console.error('Assign permissions error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ UPDATE PERMISSIONS ============

// @desc    Update admin panel permissions for existing staff
// @route   PUT /api/admin-staff/update-permissions
exports.updateStaffPermissions = async (req, res) => {
    try {
        const { 
            employeeId,
            adminEmail,
            adminPanelPassword,
            modulePermissions,
            allowedProjects,
            isAllProjectsAllowed,
            isReadOnly,
            isLoginAllowed,
            isAdminPanelAccess
        } = req.body;

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required'
            });
        }

        const staff = await Staff.findOne({ employeeId, isActive: true });
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found with this employee ID'
            });
        }

        const staffAccess = await StaffAccess.findOne({ staffId: staff._id });
        if (!staffAccess) {
            return res.status(404).json({
                success: false,
                message: 'Staff access record not found. Please assign permissions first.'
            });
        }

        // Update staff fields
        if (adminEmail !== undefined) {
            if (adminEmail) {
                const existingAdminEmail = await Staff.findOne({ 
                    adminEmail: adminEmail.toLowerCase(),
                    _id: { $ne: staff._id }
                });
                if (existingAdminEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'Admin email already exists for another staff'
                    });
                }
                staff.adminEmail = adminEmail.toLowerCase();
            } else {
                // If adminEmail is null/empty, revert to staff's regular email
                staff.adminEmail = staff.email;
            }
        }

        if (isAdminPanelAccess !== undefined) {
            staff.isAdminPanelAccess = isAdminPanelAccess;
        }

        if (adminPanelPassword) {
            const salt = await bcrypt.genSalt(10);
            staff.adminPanelPassword = await bcrypt.hash(adminPanelPassword, salt);
        }
        await staff.save();

        // Update access fields
        if (modulePermissions) {
            Object.keys(modulePermissions).forEach(key => {
                if (staffAccess.modulePermissions[key] !== undefined) {
                    staffAccess.modulePermissions[key] = modulePermissions[key];
                }
            });
        }

        if (isReadOnly !== undefined) staffAccess.isReadOnly = isReadOnly;
        if (allowedProjects !== undefined) staffAccess.allowedProjects = allowedProjects;
        if (isAllProjectsAllowed !== undefined) staffAccess.isAllProjectsAllowed = isAllProjectsAllowed;
        if (isLoginAllowed !== undefined) staffAccess.isLoginAllowed = isLoginAllowed;

        await staffAccess.save();

        res.json({
            success: true,
            message: 'Permissions updated successfully',
            data: {
                staffId: staff._id,
                employeeId: staff.employeeId,
                employeeName: staff.employeeName,
                email: staff.email,
                adminEmail: staff.adminEmail,
                hasAdminPanelPassword: !!staff.adminPanelPassword,
                isAdminPanelAccess: staff.isAdminPanelAccess,
                modulePermissions: staffAccess.modulePermissions,
                allowedProjects: staffAccess.allowedProjects,
                isAllProjectsAllowed: staffAccess.isAllProjectsAllowed,
                isReadOnly: staffAccess.isReadOnly,
                isLoginAllowed: staffAccess.isLoginAllowed,
                accessibleModules: staffAccess.getAccessibleModules()
            }
        });
    } catch (error) {
        console.error('Update permissions error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all projects from database
// @route   GET /api/projects/list
exports.getAllProjectsList = async (req, res) => {
    try {
        const projects = await Project.find({ isDeleted: false })
            .select('projectId projectName category')
            .sort({ projectName: 1 });

        res.json({
            success: true,
            data: projects,
            total: projects.length
        });
    } catch (error) {
        console.error('Get all projects error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ ADMIN PANEL LOGIN ============

// @desc    Staff login for Admin Panel
// @route   POST /api/admin-staff/login
exports.adminStaffLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find staff by email (check both staff email and admin email)
        const staff = await Staff.findOne({ 
            isActive: true,
            isAdminPanelAccess: true,
            $or: [
                { email: email.toLowerCase() },
                { adminEmail: email.toLowerCase() }
            ]
        });

        if (!staff) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials or admin access not enabled'
            });
        }

        if (!staff.adminPanelPassword) {
            return res.status(403).json({
                success: false,
                message: 'Admin panel password not set. Please contact admin.'
            });
        }

        const isMatch = await bcrypt.compare(password, staff.adminPanelPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const staffAccess = await StaffAccess.findOne({ staffId: staff._id });
        if (!staffAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access not configured. Please contact admin.'
            });
        }

        if (!staffAccess.isLoginAllowed) {
            return res.status(403).json({
                success: false,
                message: 'Login is disabled. Please contact admin.'
            });
        }

        staff.lastActive = new Date();
        await staff.save();

        staffAccess.lastLoginTime = new Date();
        staffAccess.loginAttempts = 0;
        await staffAccess.save();

        const accessibleModules = staffAccess.getAccessibleModules();

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                id: staff._id,
                employeeId: staff.employeeId,
                name: staff.employeeName,
                email: staff.email,
                adminEmail: staff.adminEmail,
                role: staff.role,
                mobile: staff.mobile,
                profileImage: staff.profileImage,
                modulePermissions: staffAccess.modulePermissions,
                accessibleModules: accessibleModules,
                isAllProjectsAllowed: staffAccess.isAllProjectsAllowed,
                allowedProjects: staffAccess.allowedProjects,
                isReadOnly: staffAccess.isReadOnly
            }
        });
    } catch (error) {
        console.error('Admin staff login error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ GET STAFF PROFILE ============

// @desc    Get admin staff profile
// @route   GET /api/admin-staff/me
exports.getAdminStaffProfile = async (req, res) => {
    try {
        const { staffId } = req.query;

        if (!staffId) {
            return res.status(400).json({
                success: false,
                message: 'Staff ID is required'
            });
        }

        const staff = await Staff.findById(staffId)
            .select('-password -adminPanelPassword');

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        const staffAccess = await StaffAccess.findOne({ staffId: staff._id })
            .populate('allowedProjects.projectId', 'projectId projectName category');

        res.json({
            success: true,
            data: {
                id: staff._id,
                employeeId: staff.employeeId,
                name: staff.employeeName,
                email: staff.email,
                adminEmail: staff.adminEmail,
                role: staff.role,
                mobile: staff.mobile,
                profileImage: staff.profileImage,
                isAdminPanelAccess: staff.isAdminPanelAccess,
                hasAdminPanelPassword: !!staff.adminPanelPassword,
                modulePermissions: staffAccess?.modulePermissions || {},
                accessibleModules: staffAccess?.getAccessibleModules() || [],
                isAllProjectsAllowed: staffAccess?.isAllProjectsAllowed || false,
                allowedProjects: staffAccess?.allowedProjects || [],
                isReadOnly: staffAccess?.isReadOnly || false
            }
        });
    } catch (error) {
        console.error('Get admin staff profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ GET ALL STAFF ============

// @desc    Get all staff with admin access info
// @route   GET /api/admin-staff
exports.getAllAdminStaff = async (req, res) => {
    try {
        const staff = await Staff.find()
            .select('-password -adminPanelPassword')
            .sort({ createdAt: -1 });

        const staffIds = staff.map(s => s._id);
        const accessRecords = await StaffAccess.find({ 
            staffId: { $in: staffIds } 
        });

        const formattedStaff = staff.map(s => {
            const access = accessRecords.find(a => 
                a.staffId.toString() === s._id.toString()
            );
            return {
                ...s.toObject(),
                isAdminPanelAccess: s.isAdminPanelAccess || false,
                hasAdminPanelPassword: !!s.adminPanelPassword,
                adminEmail: s.adminEmail || s.email,
                modulePermissions: access?.modulePermissions || {},
                accessibleModules: access?.getAccessibleModules() || [],
                isAllProjectsAllowed: access?.isAllProjectsAllowed || false,
                allowedProjects: access?.allowedProjects || [],
                isReadOnly: access?.isReadOnly || false,
                isLoginAllowed: access?.isLoginAllowed || true,
                lastLoginTime: access?.lastLoginTime || null
            };
        });

        res.json({
            success: true,
            data: formattedStaff,
            total: formattedStaff.length
        });
    } catch (error) {
        console.error('Get all admin staff error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ GET STAFF BY EMPLOYEE ID ============

// @desc    Get staff by employee ID
// @route   GET /api/admin-staff/by-employee/:employeeId
exports.getStaffByEmployeeId = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const staff = await Staff.findOne({ employeeId, isActive: true })
            .select('-password -adminPanelPassword');

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found with this employee ID'
            });
        }

        const staffAccess = await StaffAccess.findOne({ staffId: staff._id })
            .populate('allowedProjects.projectId', 'projectId projectName category');

        res.json({
            success: true,
            data: {
                ...staff.toObject(),
                isAdminPanelAccess: staff.isAdminPanelAccess || false,
                hasAdminPanelPassword: !!staff.adminPanelPassword,
                adminEmail: staff.adminEmail || staff.email,
                hasAccess: !!staffAccess,
                modulePermissions: staffAccess?.modulePermissions || {},
                accessibleModules: staffAccess?.getAccessibleModules() || [],
                isAllProjectsAllowed: staffAccess?.isAllProjectsAllowed || false,
                allowedProjects: staffAccess?.allowedProjects || [],
                isReadOnly: staffAccess?.isReadOnly || false,
                isLoginAllowed: staffAccess?.isLoginAllowed || true
            }
        });
    } catch (error) {
        console.error('Get staff by employee ID error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ GET STAFF ACCESS ============

// @desc    Get staff access by ID
// @route   GET /api/admin-staff/:id/access
exports.getStaffAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectId } = req.query;

        const staffAccess = await StaffAccess.findOne({ staffId: id })
            .populate('allowedProjects.projectId', 'projectId projectName category');

        if (!staffAccess) {
            return res.status(404).json({
                success: false,
                message: 'Staff access record not found'
            });
        }

        let projectAccess = null;

        if (projectId) {
            let hasAccess = false;
            let accessLevel = null;

            if (staffAccess.isAllProjectsAllowed) {
                hasAccess = true;
                accessLevel = 'full';
            } else {
                const project = staffAccess.allowedProjects.find(
                    p => p.projectId._id.toString() === projectId
                );
                hasAccess = !!project;
                accessLevel = project ? project.accessLevel : null;
            }

            projectAccess = {
                hasAccess,
                accessLevel,
                projectId
            };
        }

        res.json({
            success: true,
            data: {
                staffId: staffAccess.staffId,
                employeeId: staffAccess.employeeId,
                modulePermissions: staffAccess.modulePermissions,
                accessibleModules: staffAccess.getAccessibleModules(),
                isAllProjectsAllowed: staffAccess.isAllProjectsAllowed,
                allowedProjects: staffAccess.allowedProjects,
                isReadOnly: staffAccess.isReadOnly,
                isLoginAllowed: staffAccess.isLoginAllowed,
                projectAccess
            }
        });
    } catch (error) {
        console.error('Get staff access error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ TOGGLE STAFF LOGIN ============

// @desc    Toggle staff login
// @route   PUT /api/admin-staff/:id/toggle-login
exports.toggleAdminStaffLogin = async (req, res) => {
    try {
        const { id } = req.params;

        const staffAccess = await StaffAccess.findOne({ staffId: id });
        if (!staffAccess) {
            return res.status(404).json({
                success: false,
                message: 'Staff access record not found'
            });
        }

        staffAccess.isLoginAllowed = !staffAccess.isLoginAllowed;
        await staffAccess.save();

        res.json({
            success: true,
            message: `Staff login ${staffAccess.isLoginAllowed ? 'enabled' : 'disabled'}`,
            data: {
                staffId: staffAccess.staffId,
                isLoginAllowed: staffAccess.isLoginAllowed
            }
        });
    } catch (error) {
        console.error('Toggle staff login error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ STAFF LOGOUT ============

// @desc    Staff logout
// @route   POST /api/admin-staff/logout
exports.adminStaffLogout = (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};