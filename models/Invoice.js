// models/Invoice.js
const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
      default: function () {
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-6);
        return `TEMP${year}${timestamp}`;
      },
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    installmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    installmentTitle: { type: String, required: true },

    // Snapshot of GST % at invoice creation
    gstPercent: { type: Number, default: 0 },

    amount: { type: Number, required: true }, // principal
    tax: { type: Number, default: 0 }, // GST amount
    sacCode: { type: String, trim: true, default: "" },
    totalAmount: { type: Number, required: true }, // principal + tax

    status: {
      type: String,
      enum: ["generated", "sent", "paid", "overdue"],
      default: "generated",
    },
    dueDate: { type: Date },
    paymentDate: { type: Date },
    paymentMode: { type: String },
    transactionId: { type: String },
    invoicePdf: { type: String, default: "" },
    invoicePdfURL: { type: String, default: "" },
    sentAt: { type: Date },

    paymentRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentRequest",
      default: null,
    },
  },
  { timestamps: true },
);

invoiceSchema.pre("save", async function (next) {
  try {
    if (!this.invoiceNumber || this.invoiceNumber.startsWith("TEMP")) {
      const Invoice = mongoose.model("Invoice");
      const year = new Date().getFullYear();
      const lastInvoice = await Invoice.findOne({
        invoiceNumber: { $regex: `^PMSINV${year}` },
      }).sort({ invoiceNumber: -1 });

      let sequence = 1;
      if (lastInvoice) {
        const lastSeq = parseInt(
          String(lastInvoice.invoiceNumber).replace(`PMSINV${year}`, ""),
          10,
        );
        if (Number.isFinite(lastSeq)) sequence = lastSeq + 1;
      }
      this.invoiceNumber = `PMSINV${year}${String(sequence).padStart(4, "0")}`;
    }
    next();
  } catch (error) {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    this.invoiceNumber = `PMSINV${year}${timestamp}`;
    next();
  }
});

const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
module.exports = Invoice;