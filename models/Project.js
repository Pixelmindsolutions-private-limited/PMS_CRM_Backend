// const mongoose = require('mongoose');

// // Milestone Payment Schema
// const milestonePaymentSchema = new mongoose.Schema({
//   amount: {
//     type: Number,
//     required: true
//   },
//   description: {
//     type: String,
//     required: true
//   },
//   paymentMode: {
//     type: String,
//     enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque'],
//     default: 'Cash'
//   },
//   paid: {
//     type: Boolean,
//     default: false
//   }
// }, { timestamps: true });

// // Timeline Schema (for App/Website)
// const timelineSchema = new mongoose.Schema({
//   designing: String,
//   frontend: String,
//   backend: String,
//   deployment: String
// });

// // Marketing Item Schema
// const marketingItemSchema = new mongoose.Schema({
//   enabled: {
//     type: Boolean,
//     default: false
//   },
//   duration: String,
//   quantity: Number,
//   startDate: Date
// });

// // Marketing Services Schema
// const marketingServicesSchema = new mongoose.Schema({
//   reels: {
//     type: marketingItemSchema,
//     default: () => ({})
//   },
//   posters: {
//     type: marketingItemSchema,
//     default: () => ({})
//   },
//   seo: {
//     type: Boolean,
//     default: false
//   },
//   keywords: {
//     type: Boolean,
//     default: false
//   },
//   banners: {
//     type: Boolean,
//     default: false
//   }
// });

// // Budget Installment Schema
// const budgetInstallmentSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true
//   },
//   amount: {
//     type: Number,
//     required: true
//   },
//   deadline: Date
// });

// // Main Project Schema
// const projectSchema = new mongoose.Schema({
//   // Basic Information
//   projectId: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   projectName: {
//     type: String,
//     required: true
//   },
//   clientName: {
//     type: String,
//     required: true
//   },
//   clientMobile: {
//     type: String,
//     required: true
//   },
//   clientEmail: {
//     type: String,
//     required: true
//   },
//   clientAddress: String,
  
//   // Category and Status
//   category: {
//     type: String,
//     enum: ['website', 'mobile app', 'digital market', 'software'],
//     default: 'website'
//   },
//   status: {
//     type: String,
//     enum: ['active', 'completed', 'on hold', 'cancelled'],
//     default: 'active'
//   },

//   // Dates
//   startDate: Date,
//   handoverDate: Date,
//   deadlineDate: Date,

//   // Financial
//   projectCost: Number,
//   milestone: Number,

//   // Team Members
//   teamMembers: {
//     frontend: [String],
//     backend: [String],
//     designer: [String],
//     tester: [String],
//     manager: [String]
//   },

//   // Payments
//   milestonePayments: [milestonePaymentSchema],
//   budgetInstallments: [budgetInstallmentSchema],

//   // Files
//   uploadFile: String,
//   quotationFile: String,

//   // App/Website Specific
//   appId: String,
//   appName: String,
//   timeline: timelineSchema,

//   // Digital Marketing Specific
//   marketing: marketingServicesSchema,

//   // Metadata
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// }, {
//   timestamps: true
// });

// // Generate project ID before saving if not provided
// projectSchema.pre('save', async function(next) {
//   if (!this.projectId) {
//     const count = await mongoose.model('Project').countDocuments();
//     const year = new Date().getFullYear().toString().slice(-2);
//     this.projectId = `PRJ${year}${String(count + 1).padStart(4, '0')}`;
//   }
//   next();
// });

// // Update timestamps on save
// projectSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

// module.exports = mongoose.model('Project', projectSchema);


const mongoose = require('mongoose');

// Timeline schema for app/website development
const timelineSchema = new mongoose.Schema({
  designing: { type: String, default: '' },
  frontend: { type: String, default: '' },
  backend: { type: String, default: '' },
  deployment: { type: String, default: '' }
}, { _id: false });

// Marketing service schema
const marketingServiceSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  duration: { type: String, default: '' },
  quantity: { type: Number, default: 0 },
  startDate: { type: Date, default: null }
}, { _id: false });

// Marketing schema
const marketingSchema = new mongoose.Schema({
  reels: { type: marketingServiceSchema, default: () => ({}) },
  posters: { type: marketingServiceSchema, default: () => ({}) },
  seo: { type: Boolean, default: false },
  keywords: { type: Boolean, default: false },
  banners: { type: Boolean, default: false }
}, { _id: false });

// App/Website details schema
const appDetailsSchema = new mongoose.Schema({
  appId: { type: String, default: '' },
  appName: { type: String, default: '' },
  timeline: { type: timelineSchema, default: () => ({}) }
}, { _id: false });

// Budget installment schema
const budgetInstallmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  deadline: { type: Date, default: null }
}, { _id: false });

// Milestone payment schema
const milestonePaymentSchema = new mongoose.Schema({
  description: { type: String, default: '' },
  amount: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  paymentMode: { type: String, enum: ['cash', 'bank transfer', 'upi', 'cheque'], default: 'cash' },
  paymentDate: { type: Date, default: null }
}, { _id: true });

// Team members schema
const teamMembersSchema = new mongoose.Schema({
  frontend: [{ type: String }],
  backend: [{ type: String }],
  designer: [{ type: String }],
  tester: [{ type: String }],
  manager: [{ type: String }]
}, { _id: false });

// Main Project Schema
const projectSchema = new mongoose.Schema({
  projectId: { type: String, unique: true, trim: true },
  projectName: { type: String, unique: true, required: true, trim: true },
  clientName: { type: String, required: true, trim: true },
  clientMobile: { type: String, trim: true },
  clientEmail: { type: String, unique: true, trim: true, lowercase: true },
  clientAddress: { type: String, default: '' },
  category: { 
    type: String, 
    enum: ['website', 'mobile app', 'software', 'digital market'], 
    default: 'website' 
  },
  startDate: { type: Date, default: null },
  projectHandoverDate: { type: Date, default: null },
  deadlineDate: { type: Date, default: null },
  duration: { type: String, default: '' },
  projectCost: { type: Number, default: 0 },
  milestone: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['active', 'on hold', 'completed', 'cancelled'], 
    default: 'active' 
  },
  appDetails: { type: appDetailsSchema, default: () => ({}) },
  marketing: { type: marketingSchema, default: () => ({}) },
  budgetInstallments: [budgetInstallmentSchema],
  milestonePayments: [milestonePaymentSchema],
  teamMembers: { type: teamMembersSchema, default: () => ({}) }
}, { timestamps: true });

projectSchema.pre('save', async function(next) {
  // Only generate if projectId is not already set
  if (!this.projectId || this.projectId === '') {
    try {
      const Project = mongoose.model('Project');
      const count = await Project.countDocuments();
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const sequence = String(count + 1).padStart(4, '0');
      this.projectId = `PRJ${year}${month}${sequence}`;
      console.log(`✅ Auto-generated projectId: ${this.projectId}`);
    } catch (error) {
      console.error('Error generating projectId:', error);
      // Fallback to timestamp-based ID
      this.projectId = `PRJ${Date.now()}`;
    }
  }
  next();
});

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

module.exports = Project;