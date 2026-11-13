// models/PaymentRequest.js
const mongoose = require("mongoose");

const paymentRequestSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    installmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    installmentTitle: { type: String, required: true, trim: true },
    installmentExpectedAmount: { type: Number, required: true, min: 0 },

    paidAmount: { type: Number, required: true, min: 0.01 },
    reason: { type: String, default: "", trim: true },

    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "cheque", "card", "other"],
      default: "upi",
    },
    transactionId: { type: String, default: "", trim: true },
    proofImageUrl: { type: String, default: "", trim: true },
    paymentDate: { type: Date, default: Date.now },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    adminRemark: { type: String, default: "", trim: true },

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      default: null,
    },
    invoiceNumber: { type: String, default: "" },
  },
  { timestamps: true },
);

paymentRequestSchema.index(
  { installmentId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

paymentRequestSchema.virtual("shortfall").get(function () {
  return Number(
    Math.max(0, this.installmentExpectedAmount - this.paidAmount).toFixed(2),
  );
});
paymentRequestSchema.virtual("isPartial").get(function () {
  return this.paidAmount < this.installmentExpectedAmount;
});

paymentRequestSchema.set("toJSON", { virtuals: true });
paymentRequestSchema.set("toObject", { virtuals: true });

const PaymentRequest =
  mongoose.models.PaymentRequest ||
  mongoose.model("PaymentRequest", paymentRequestSchema);

module.exports = PaymentRequest;