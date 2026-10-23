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
const mongoose = require("mongoose");

// ============ INSTALLMENT SCHEMA ============
const installmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Existing field, kept for backward compatibility
    type: {
      type: String,
      enum: ["amount", "percentage"],
      required: true,
    },

    // Installment principal, excluding taxes
    value: {
      type: Number,
      required: true,
      min: 0,
    },

    // Optional taxes, default to 0%
    gstPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    sgstPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Calculated tax amounts
    gstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    sgstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Principal + GST + SGST
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    paymentDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    invoiceNumber: {
      type: String,
      default: "",
      trim: true,
    },

    invoicePdfUrl: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

// Team member schema
const teamMemberSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false },
);

// Work division schema
const workDivisionSchema = new mongoose.Schema(
  {
    designing: { type: Number, default: 0 },
    frontend: { type: Number, default: 0 },
    backend: { type: Number, default: 0 },
    testing: { type: Number, default: 0 },
    deployment: { type: Number, default: 0 },
    marketing: { type: Number, default: 0 },
  },
  { _id: false },
);

const digitalMarketingSchema = new mongoose.Schema(
  {
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DigitalMarketingPlan",
      default: null,
    },
    planName: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
    },
    features: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      unique: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: false,
    },

    // ✅ SNAPSHOT FIELDS — client info at project creation time
    clientName: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    mailId: { type: String, default: "" },

    projectName: { type: String, required: true },
    projectCost: { type: Number, default: 0 },
    projectStartDate: Date,
    projectEndDate: Date,
    deadline: Date,
    paymentMilestone: { type: Number, default: 0 },
    category: {
      type: String,
      enum: ["mobile app", "website", "software", "digital marketing"],
      default: "website",
    },
    workDivision: {
      type: workDivisionSchema,
      default: () => ({}),
    },
    teamAssignment: {
      designing: { type: [teamMemberSchema], default: [] },
      frontend: { type: [teamMemberSchema], default: [] },
      backend: { type: [teamMemberSchema], default: [] },
      testing: { type: [teamMemberSchema], default: [] },
      deployment: { type: [teamMemberSchema], default: [] },
      marketing: { type: [teamMemberSchema], default: [] },
    },
    digitalMarketing: {
      type: digitalMarketingSchema,
      default: null,
    },
    // ============ INSTALLMENTS ============
    installments: {
      type: [installmentSchema],
      default: [],
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Generate sequential project ID (PMSPRJ0001, PMSPRJ0002, ...)
projectSchema.statics.generateProjectId = async function () {
  try {
    const lastProject = await this.findOne({
      projectId: { $regex: /^PMSPRJ/ },
    }).sort({ projectId: -1 });

    let sequence = 1;
    if (lastProject) {
      const lastSeq = parseInt(lastProject.projectId.replace("PMSPRJ", ""));
      sequence = lastSeq + 1;
    }

    const seqStr = String(sequence).padStart(4, "0");
    const projectId = `PMSPRJ${seqStr}`;

    console.log(`✅ Generated projectId: ${projectId} (Sequence: ${sequence})`);

    return projectId;
  } catch (error) {
    throw new Error(`Failed to generate project ID: ${error.message}`);
  }
};

// ============ INSTANCE METHODS ============

// Calculate payment summary
projectSchema.methods.calculatePaymentSummary = function () {
  let totalPaid = 0;

  this.installments.forEach((installment) => {
    if (installment.status === "paid") {
      let amount = 0;
      if (installment.type === "percentage") {
        amount = (installment.value / 100) * this.projectCost;
      } else {
        amount = installment.value;
      }
      totalPaid += amount;
    }
  });

  this.totalPaid = totalPaid;
  this.remainingAmount = this.projectCost - totalPaid;

  return {
    totalPaid: this.totalPaid,
    remainingAmount: this.remainingAmount,
  };
};

// Validate installments count against milestones
projectSchema.methods.validateInstallments = function () {
  if (this.installments.length > this.paymentMilestone) {
    throw new Error(
      `Cannot have more than ${this.paymentMilestone} installments`,
    );
  }
  return true;
};

// ============ PRE-SAVE HOOK ============

projectSchema.pre("save", async function (next) {
  try {
    // Generate project ID
    if (!this.projectId) {
      this.projectId = await this.constructor.generateProjectId();
    }

    // Calculate payment summary
    this.calculatePaymentSummary();

    // Validate installments count
    this.validateInstallments();

    next();
  } catch (error) {
    next(error);
  }
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
