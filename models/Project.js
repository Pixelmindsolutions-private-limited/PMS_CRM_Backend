// models/Project.js
const mongoose = require("mongoose");

/* ============================================================
 * INSTALLMENT SUB-SCHEMA (GST only — inherited from project)
 * ============================================================ */
const installmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["amount", "percentage"],
      required: true,
      default: "amount",
    },
    value: { type: Number, required: true, min: 0 },
    sacCode: { type: String, default: "", trim: true },

    // Computed tax amounts (derived from project-level GST %)
    gstAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },

    dueDate: { type: Date, default: null },
    paymentDate: { type: Date, default: null },

    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    /* Payment tracking */
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending_approval", "partial_approved", "paid"],
      default: "unpaid",
      index: true,
    },
    paidAmount: { type: Number, default: 0, min: 0 },
    requestedAmount: { type: Number, default: 0, min: 0 },
    pendingRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentRequest",
      default: null,
    },

    invoiceNumber: { type: String, default: "", trim: true },
    invoicePdfUrl: { type: String, default: "" },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

/* ============================================================
 * SUPPORTING SUB-SCHEMAS
 * ============================================================ */
const teamMemberSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false },
);

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
    planName: { type: String, default: "" },
    duration: { type: String, default: "" },
    price: { type: Number, default: 0 },
    features: { type: [String], default: [] },
  },
  { _id: false },
);

/* ============================================================
 * PROJECT SCHEMA
 * ============================================================ */
const projectSchema = new mongoose.Schema(
  {
    projectId: { type: String, unique: true },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: false,
    },

    clientName: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    mailId: { type: String, default: "" },

    projectName: { type: String, required: true },
    projectCost: { type: Number, default: 0, min: 0 },

    /* GST config — set once at project creation */
    gstPercent: { type: Number, default: 9, min: 0, max: 100 },

    projectStartDate: Date,
    projectEndDate: Date,
    deadline: Date,
    paymentMilestone: { type: Number, default: 0, min: 0 },
    category: {
      type: String,
      enum: ["mobile app", "website", "software", "digital marketing"],
      default: "website",
    },
    workDivision: { type: workDivisionSchema, default: () => ({}) },
    teamAssignment: {
      designing: { type: [teamMemberSchema], default: [] },
      frontend: { type: [teamMemberSchema], default: [] },
      backend: { type: [teamMemberSchema], default: [] },
      testing: { type: [teamMemberSchema], default: [] },
      deployment: { type: [teamMemberSchema], default: [] },
      marketing: { type: [teamMemberSchema], default: [] },
    },
    digitalMarketing: { type: digitalMarketingSchema, default: null },

    installments: { type: [installmentSchema], default: [] },
    totalPaid: { type: Number, default: 0, min: 0 },
    remainingAmount: { type: Number, default: 0, min: 0 },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/* ============================================================
 * STATICS
 * ============================================================ */
projectSchema.statics.generateProjectId = async function () {
  const last = await this.findOne({ projectId: { $regex: /^PMSPRJ/ } }).sort({
    projectId: -1,
  });
  let seq = 1;
  if (last) {
    const parsed = parseInt(String(last.projectId).replace("PMSPRJ", ""), 10);
    if (Number.isFinite(parsed)) seq = parsed + 1;
  }
  return `PMSPRJ${String(seq).padStart(4, "0")}`;
};

/* ============================================================
 * INSTANCE METHODS
 * ============================================================ */

/**
 * Recalculate project totals from installments.
 * Sum of paidAmount across installments = totalPaid.
 * remainingAmount = projectCost - totalPaid
 */
projectSchema.methods.calculatePaymentSummary = function () {
  const baseCost = Number(this.projectCost || 0);
  const gstPercent = Number(this.gstPercent || 0);

  const gstAmount = Number(
    ((baseCost * gstPercent) / 100).toFixed(2)
  );

  const totalCost = Number((baseCost + gstAmount).toFixed(2));

  const paid = this.installments.reduce(
    (sum, installment) => sum + Number(installment.paidAmount || 0),
    0
  );

  this.totalPaid = Number(paid.toFixed(2));

  this.remainingAmount = Number(
    Math.max(0, totalCost - this.totalPaid).toFixed(2)
  );

  return {
    totalPaid: this.totalPaid,
    remainingAmount: this.remainingAmount,
  };
};

/**
 * Total principal allocated to installments (excludes taxes).
 */
projectSchema.methods.getAllocatedAmount = function () {
  let allocated = 0;
  for (const inst of this.installments) {
    const principal =
      inst.type === "percentage"
        ? (Number(inst.value) / 100) * Number(this.projectCost || 0)
        : Number(inst.value);
    allocated += principal;
  }
  return Number(allocated.toFixed(2));
};

/**
 * Guard against too many installments.
 */
projectSchema.methods.validateInstallments = function () {
  if (
    this.paymentMilestone > 0 &&
    this.installments.length > this.paymentMilestone
  ) {
    throw new Error(
      `Cannot have more than ${this.paymentMilestone} installments`,
    );
  }
  return true;
};

/**
 * Recompute GST + total for one installment using project-level GST %.
 */
projectSchema.methods.recalcInstallmentTax = function (inst) {
  const principal =
    inst.type === "percentage"
      ? (Number(inst.value) / 100) * Number(this.projectCost || 0)
      : Number(inst.value);
  const gst = (principal * Number(this.gstPercent || 0)) / 100;
  inst.gstAmount = Number(gst.toFixed(2));
  inst.totalAmount = Number((principal + gst).toFixed(2));
  return principal;
};

/* ============================================================
 * PRE-SAVE HOOK
 * ============================================================ */
projectSchema.pre("save", async function (next) {
  try {
    if (!this.projectId) {
      this.projectId = await this.constructor.generateProjectId();
    }
    this.calculatePaymentSummary();
    this.validateInstallments();
    next();
  } catch (err) {
    next(err);
  }
});

const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);
module.exports = Project;