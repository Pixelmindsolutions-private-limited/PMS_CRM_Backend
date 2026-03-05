const mongoose = require('mongoose');

// Milestone Payment Schema
const milestonePaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque'],
    default: 'Cash'
  },
  paid: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Timeline Schema (for App/Website)
const timelineSchema = new mongoose.Schema({
  designing: String,
  frontend: String,
  backend: String,
  deployment: String
});

// Marketing Item Schema
const marketingItemSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  duration: String,
  quantity: Number,
  startDate: Date
});

// Marketing Services Schema
const marketingServicesSchema = new mongoose.Schema({
  reels: {
    type: marketingItemSchema,
    default: () => ({})
  },
  posters: {
    type: marketingItemSchema,
    default: () => ({})
  },
  seo: {
    type: Boolean,
    default: false
  },
  keywords: {
    type: Boolean,
    default: false
  },
  banners: {
    type: Boolean,
    default: false
  }
});

// Budget Installment Schema
const budgetInstallmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  deadline: Date
});

// Main Project Schema
const projectSchema = new mongoose.Schema({
  // Basic Information
  projectId: {
    type: String,
    required: true,
    unique: true
  },
  projectName: {
    type: String,
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  clientMobile: {
    type: String,
    required: true
  },
  clientEmail: {
    type: String,
    required: true
  },
  clientAddress: String,
  
  // Category and Status
  category: {
    type: String,
    enum: ['website', 'mobile app', 'digital market', 'software'],
    default: 'website'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on hold', 'cancelled'],
    default: 'active'
  },

  // Dates
  startDate: Date,
  handoverDate: Date,
  deadlineDate: Date,

  // Financial
  projectCost: Number,
  milestone: Number,

  // Team Members
  teamMembers: {
    frontend: [String],
    backend: [String],
    designer: [String],
    tester: [String],
    manager: [String]
  },

  // Payments
  milestonePayments: [milestonePaymentSchema],
  budgetInstallments: [budgetInstallmentSchema],

  // Files
  uploadFile: String,
  quotationFile: String,

  // App/Website Specific
  appId: String,
  appName: String,
  timeline: timelineSchema,

  // Digital Marketing Specific
  marketing: marketingServicesSchema,

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate project ID before saving if not provided
projectSchema.pre('save', async function(next) {
  if (!this.projectId) {
    const count = await mongoose.model('Project').countDocuments();
    const year = new Date().getFullYear().toString().slice(-2);
    this.projectId = `PRJ${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Update timestamps on save
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Project', projectSchema);