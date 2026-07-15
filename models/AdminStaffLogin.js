// models/StaffAccess.js
const mongoose = require('mongoose');

const staffAccessSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true,
        unique: true
    },
    employeeId: {
        type: String,
        required: true,
        ref: 'Staff'
    },

    // ============ MODULE PERMISSIONS ============
    modulePermissions: {
        dashboard: { type: Boolean, default: true },
        staffManagement: { type: Boolean, default: false },
        projects: { type: Boolean, default: false },
        clients: { type: Boolean, default: false },
        payments: { type: Boolean, default: false },
        invoices: { type: Boolean, default: false },
        reminders: { type: Boolean, default: false },
        reports: { type: Boolean, default: false },
        settings: { type: Boolean, default: false },
        attendance: { type: Boolean, default: false },
        digitalMarketing: { type: Boolean, default: false },
        worksheets: { type: Boolean, default: false }
    },

    // ============ PROJECT ACCESS ============
    allowedProjects: [{
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project'
        },
        accessLevel: {
            type: String,
            enum: ['view', 'edit', 'manage', 'full'],
            default: 'view'
        }
    }],

    isAllProjectsAllowed: {
        type: Boolean,
        default: false
    },

    // ============ ACCESS CONTROL ============
    isReadOnly: {
        type: Boolean,
        default: false
    },

    isLoginAllowed: {
        type: Boolean,
        default: true
    },

    // ============ AUDIT ============
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }

}, { timestamps: true });


// Get accessible modules
staffAccessSchema.methods.getAccessibleModules = function() {
    return Object.keys(this.modulePermissions).filter(
        key => this.modulePermissions[key] === true
    );
};

// Check if has module access
staffAccessSchema.methods.hasModuleAccess = function(moduleName) {
    return this.modulePermissions[moduleName] === true;
};

// Check if has project access
staffAccessSchema.methods.hasProjectAccess = function(projectId) {
    if (this.isAllProjectsAllowed) return true;
    return this.allowedProjects.some(p => 
        p.projectId.toString() === projectId.toString()
    );
};

// Get project access level
staffAccessSchema.methods.getProjectAccessLevel = function(projectId) {
    if (this.isAllProjectsAllowed) return 'full';
    const project = this.allowedProjects.find(p => 
        p.projectId.toString() === projectId.toString()
    );
    return project ? project.accessLevel : null;
};

const StaffAccess = mongoose.model('StaffAccess', staffAccessSchema);
module.exports = StaffAccess;
