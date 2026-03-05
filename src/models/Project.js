const mongoose = require('mongoose');

const milestonePaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  description: String,
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

const teamMemberSchema = new mongoose.Schema({
  role: String,
  members: [String]
});

const projectSchema = new mongoose.Schema({
  projectid: {
    type: String,
    required: true,
    unique: true
  },
  projectname: {
    type: String,
    required: true
  },
  clientname: {
    type: String,
    required: true
  },
  mobilenumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  clientAddress: String,
  selectcategory: {
    type: String,
    enum: ['website', 'mobile app', 'digital market', 'software', 'consulting'],
    default: 'website'
  },
  startDate: Date,
  projectHandoverDate: Date,
  deadlineDate: Date,
  projectCost: Number,
  milestone: Number,
  status: {
    type: String,
    enum: ['active', 'on hold', 'completed', 'cancelled'],
    default: 'active'
  },
  teamMembers: {
    frontend: [String],
    backend: [String],
    designer: [String],
    tester: [String],
    manager: [String]
  },
  milestonePayments: [milestonePaymentSchema],
  uploadfile: String,
  quotationfile: String,
  
  // For App/Website projects
  appId: String,
  appName: String,
  timeline: {
    designing: String,
    frontend: String,
    backend: String,
    deployment: String
  },
  
  // For Digital Marketing
  marketing: {
    reels: {
      enabled: Boolean,
      duration: String,
      quantity: Number,
      startDate: Date
    },
    posters: {
      enabled: Boolean,
      duration: String,
      quantity: Number,
      startDate: Date
    },
    seo: Boolean,
    keywords: Boolean,
    banners: Boolean
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);