// const mongoose = require('mongoose');

// // Timeline schema for app/website development
// const timelineSchema = new mongoose.Schema({
//   designing: { type: String, default: '' },
//   frontend: { type: String, default: '' },
//   backend: { type: String, default: '' },
//   deployment: { type: String, default: '' }
// }, { _id: false });

// // Marketing service schema
// const marketingServiceSchema = new mongoose.Schema({
//   enabled: { type: Boolean, default: false },
//   duration: { type: String, default: '' },
//   quantity: { type: Number, default: 0 },
//   startDate: { type: Date, default: null }
// }, { _id: false });

// // Marketing schema
// const marketingSchema = new mongoose.Schema({
//   reels: { type: marketingServiceSchema, default: () => ({}) },
//   posters: { type: marketingServiceSchema, default: () => ({}) },
//   seo: { type: Boolean, default: false },
//   keywords: { type: Boolean, default: false },
//   banners: { type: Boolean, default: false }
// }, { _id: false });

// // App/Website details schema
// const appDetailsSchema = new mongoose.Schema({
//   appId: { type: String, default: '' },
//   appName: { type: String, default: '' },
//   timeline: { type: timelineSchema, default: () => ({}) }
// }, { _id: false });

// // Budget installment schema
// const budgetInstallmentSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   amount: { type: Number, required: true },
//   deadline: { type: Date, default: null }
// }, { _id: false });

// // Milestone payment schema
// const milestonePaymentSchema = new mongoose.Schema({
//   description: { type: String, default: '' },
//   amount: { type: Number, required: true },
//   paid: { type: Boolean, default: false },
//   paymentMode: { type: String, enum: ['cash', 'bank transfer', 'upi', 'cheque'], default: 'cash' },
//   paymentDate: { type: Date, default: null }
// }, { _id: true });

// // Team members schema
// const teamMembersSchema = new mongoose.Schema({
//   frontend: [{ type: String }],
//   backend: [{ type: String }],
//   designer: [{ type: String }],
//   tester: [{ type: String }],
//   manager: [{ type: String }]
// }, { _id: false });

// // Main Project Schema
// const projectSchema = new mongoose.Schema({
//   projectId: { type: String, unique: true, trim: true },
//   projectName: { type: String, unique: true, required: true, trim: true },
//   clientName: { type: String, required: true, trim: true },
//   clientMobile: { type: String, trim: true },
//   clientEmail: { type: String, unique: true, trim: true, lowercase: true },
//   clientAddress: { type: String, default: '' },
//   category: { 
//     type: String, 
//     enum: ['website', 'mobile app', 'software', 'digital market'], 
//     default: 'website' 
//   },
//   startDate: { type: Date, default: null },
//   projectHandoverDate: { type: Date, default: null },
//   deadlineDate: { type: Date, default: null },
//   duration: { type: String, default: '' },
//   projectCost: { type: Number, default: 0 },
//   milestone: { type: Number, default: 0 },
//   status: { 
//     type: String, 
//     enum: ['active', 'on hold', 'completed', 'cancelled'], 
//     default: 'active' 
//   },
//   appDetails: { type: appDetailsSchema, default: () => ({}) },
//   marketing: { type: marketingSchema, default: () => ({}) },
//   budgetInstallments: [budgetInstallmentSchema],
//   milestonePayments: [milestonePaymentSchema],
//   teamMembers: { type: teamMembersSchema, default: () => ({}) }
// }, { timestamps: true });

// projectSchema.pre('save', async function(next) {
//   // Only generate if projectId is not already set
//   if (!this.projectId || this.projectId === '') {
//     try {
//       const Project = mongoose.model('Project');
//       const count = await Project.countDocuments();
//       const year = new Date().getFullYear().toString().slice(-2);
//       const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
//       const sequence = String(count + 1).padStart(4, '0');
//       this.projectId = `PRJ${year}${month}${sequence}`;
//       console.log(`✅ Auto-generated projectId: ${this.projectId}`);
//     } catch (error) {
//       console.error('Error generating projectId:', error);
//       // Fallback to timestamp-based ID
//       this.projectId = `PRJ${Date.now()}`;
//     }
//   }
//   next();
// });

// const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

// module.exports = Project;

// // models/Project.js
// const mongoose = require('mongoose');

// // Team member schema (for objects)
// const teamMemberSchema = new mongoose.Schema({
//     employeeId: { type: String, required: true },
//     name: { type: String, required: true },
//     role: { type: String, required: true }
// }, { _id: false });

// // Work division schema
// const workDivisionSchema = new mongoose.Schema({
//     designing: { type: Number, default: 0 },
//     frontend: { type: Number, default: 0 },
//     backend: { type: Number, default: 0 },
//     testing: { type: Number, default: 0 },
//     deployment: { type: Number, default: 0 }
// }, { _id: false });

// const projectSchema = new mongoose.Schema({
//     clientId: { 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: 'Client',
//         required: true 
//     },
//     projectName: { type: String, required: true },
//     projectCost: { type: Number, default: 0 },
//     projectStartDate: Date,
//     projectEndDate: Date,
//     deadline: Date,
//     paymentMilestone: { type: Number, default: 0 },
//     category: {
//         type: String,
//         enum: ['mobile app', 'website', 'software', 'digital marketing'],
//         default: 'website'
//     },
//     workDivision: { 
//         type: workDivisionSchema, 
//         default: () => ({}) 
//     },
//     teamAssignment: {
//         designing: [teamMemberSchema],
//         frontend: [teamMemberSchema],
//         backend: [teamMemberSchema],
//         testing: [teamMemberSchema],
//         deployment: [teamMemberSchema]
//     }
// }, { timestamps: true });

// const Project = mongoose.model('Project', projectSchema);

// module.exports = Project;

// models/Project.js
const mongoose = require('mongoose');

// Team member schema
const teamMemberSchema = new mongoose.Schema({
    employeeId: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true }
}, { _id: false });

// Work division schema
const workDivisionSchema = new mongoose.Schema({
    designing: { type: Number, default: 0 },
    frontend: { type: Number, default: 0 },
    backend: { type: Number, default: 0 },
    testing: { type: Number, default: 0 },
    deployment: { type: Number, default: 0 }
}, { _id: false });

const projectSchema = new mongoose.Schema({
    projectId: { 
        type: String, 
        unique: true 
    },
    clientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Client',
        required: true 
    },
    projectName: { type: String, required: true },
    projectCost: { type: Number, default: 0 },
    projectStartDate: Date,
    projectEndDate: Date,
    deadline: Date,
    paymentMilestone: { type: Number, default: 0 },
    category: {
        type: String,
        enum: ['mobile app', 'website', 'software', 'digital marketing'],
        default: 'website'
    },
    workDivision: { 
        type: workDivisionSchema, 
        default: () => ({}) 
    },
    teamAssignment: {
        designing: { type: [teamMemberSchema], default: [] },
        frontend: { type: [teamMemberSchema], default: [] },
        backend: { type: [teamMemberSchema], default: [] },
        testing: { type: [teamMemberSchema], default: [] },
        deployment: { type: [teamMemberSchema], default: [] }
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
}, { timestamps: true });


// Generate sequential project ID (PMSPRJ0001, PMSPRJ0002, ...)
projectSchema.statics.generateProjectId = async function() {
    try {
        const lastProject = await this.findOne({ 
            projectId: { $regex: /^PMSPRJ/ }
        }).sort({ projectId: -1 });
        
        let sequence = 1;
        if (lastProject) {
            const lastSeq = parseInt(lastProject.projectId.replace('PMSPRJ', ''));
            sequence = lastSeq + 1;
        }
        
        const seqStr = String(sequence).padStart(4, '0');
        const projectId = `PMSPRJ${seqStr}`;
        
        console.log(`✅ Generated projectId: ${projectId} (Sequence: ${sequence})`);
        
        return projectId;
    } catch (error) {
        throw new Error(`Failed to generate project ID: ${error.message}`);
    }
};

// ============ PRE-SAVE HOOK ============

projectSchema.pre('save', async function(next) {
    try {
        if (!this.projectId) {
            this.projectId = await this.constructor.generateProjectId();
        }
        next();
    } catch (error) {
        next(error);
    }
});


const Project = mongoose.model('Project', projectSchema);

module.exports = Project;