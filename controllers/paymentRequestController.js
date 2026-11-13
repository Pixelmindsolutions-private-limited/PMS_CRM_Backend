// controllers/paymentRequest.controller.js
const mongoose = require("mongoose");
const PaymentRequest = require("../models/PaymentRequest");
const Project = require("../models/Project");
const Invoice = require("../models/Invoice");

/* -------- Helpers -------- */
async function findProjectByAnyId(projectId, session = null) {
  const q = { isDeleted: { $ne: true } };
  const sess = session ? { session } : {};
  if (mongoose.Types.ObjectId.isValid(projectId)) {
    const byId = await Project.findOne({ ...q, _id: projectId }, null, sess);
    if (byId) return byId;
  }
  return Project.findOne({ ...q, projectId }, null, sess);
}

function calcInstallmentPrincipal(project, installment) {
  const nominal =
    installment.type === "percentage"
      ? (Number(installment.value) / 100) * Number(project.projectCost || 0)
      : Number(installment.value);
  return Number(nominal.toFixed(2));
}

/* ================================================================
 * 1. ADMIN — RECORD OFFLINE PAYMENT
 *    POST /api/payment-requests
 *    Immediately updates project totals + installment + invoice.
 *    No "pending_approval" step — admin is the approver.
 * ================================================================ */
exports.createPaymentRequest = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const {
      projectId,
      installmentId,
      paidAmount,
      note = "",             // replaces "reason"
      reason = "",           // backward-compat alias
      paymentMode = "upi",
      transactionId = "",
      proofImageUrl = "",
      paymentDate = null,
    } = req.body;

    const adminId = req.user?.id || null;
    const finalNote = String(note || reason || "").trim();

    if (!projectId || !installmentId) {
      return res.status(400).json({
        success: false,
        message: "projectId and installmentId are required",
      });
    }

    const paid = Number(paidAmount);
    if (!Number.isFinite(paid) || paid <= 0) {
      return res.status(400).json({
        success: false,
        message: "paidAmount must be a positive number",
      });
    }

    let result;

    await session.withTransaction(async () => {
      const project = await findProjectByAnyId(projectId, session);
      if (!project) throw new Error("Project not found");
      if (!project.clientId) throw new Error("Project has no linked client");

      const installment = project.installments.id(installmentId);
      if (!installment) throw new Error("Installment not found on project");

      if (installment.paymentStatus === "paid") {
        throw new Error("Installment already fully paid");
      }
      if (installment.paymentStatus === "pending_approval") {
        throw new Error(
          "Installment has a pending client payment request. Approve/reject it first (or delete it).",
        );
      }

      const expected = calcInstallmentPrincipal(project, installment);
      const previousPaid = Number(installment.paidAmount || 0);
      const newPaidAmount = Number((previousPaid + paid).toFixed(2));

      // Guard against overpaying this installment
      if (newPaidAmount > expected + 0.01) {
        throw new Error(
          `Overpay not allowed. Expected ₹${expected.toFixed(2)}, ` +
            `already paid ₹${previousPaid.toFixed(2)}, ` +
            `attempted ₹${paid.toFixed(2)} (total ₹${newPaidAmount.toFixed(2)})`,
        );
      }

      // Attach uploaded file URL if multipart
      let uploadedUrl = String(proofImageUrl || "").trim();
      if (req.file) {
        uploadedUrl = `/uploads/payment-proofs/${req.file.filename}`;
      }

      // Create the payment request as ALREADY APPROVED
      const paymentRequest = new PaymentRequest({
        projectId: project._id,
        clientId: project.clientId,
        installmentId: installment._id,
        installmentTitle: installment.title,
        installmentExpectedAmount: expected,
        paidAmount: Number(paid.toFixed(2)),
        reason: finalNote,
        paymentMode,
        transactionId: String(transactionId || "").trim(),
        proofImageUrl: uploadedUrl,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        status: "approved", // auto-approved: admin entered it
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminRemark: "Recorded by admin (offline payment)",
      });
      await paymentRequest.save({ session });

      // Update installment
      installment.paidAmount = newPaidAmount;
      installment.requestedAmount = paid;
      installment.paymentDate = paymentRequest.paymentDate;
      installment.pendingRequestId = null;

      if (newPaidAmount + 0.01 >= expected) {
        installment.paymentStatus = "paid";
        installment.status = "paid";
      } else {
        installment.paymentStatus = "partial_approved";
        installment.status = "pending";
      }

      // Recalculate project totals
      project.calculatePaymentSummary();
      await project.save({ session });

      // Create or accumulate invoice
      const gstRate = Number(project.gstPercent || 0);
      const gstAmountForPaid = Number(((paid * gstRate) / 100).toFixed(2));
      const totalForPaid = Number((paid + gstAmountForPaid).toFixed(2));

      let invoice = await Invoice.findOne({
        projectId: project._id,
        installmentId: installment._id,
      }).session(session);

      if (!invoice) {
        invoice = new Invoice({
          projectId: project._id,
          clientId: project.clientId,
          installmentId: installment._id,
          installmentTitle: installment.title,
          sacCode: installment.sacCode || "",
          gstPercent: gstRate,
          amount: paid,
          tax: gstAmountForPaid,
          totalAmount: totalForPaid,
          status: "paid",
          dueDate: installment.dueDate || null,
          paymentDate: paymentRequest.paymentDate,
          paymentMode,
          transactionId: paymentRequest.transactionId,
          paymentRequestId: paymentRequest._id,
        });
        await invoice.save({ session });
      } else {
        invoice.amount = Number(
          (Number(invoice.amount || 0) + paid).toFixed(2),
        );
        invoice.tax = Number(
          (Number(invoice.tax || 0) + gstAmountForPaid).toFixed(2),
        );
        invoice.totalAmount = Number(
          (Number(invoice.totalAmount || 0) + totalForPaid).toFixed(2),
        );
        invoice.status = "paid";
        invoice.paymentDate = paymentRequest.paymentDate;
        if (paymentRequest.transactionId) {
          invoice.transactionId = paymentRequest.transactionId;
        }
        invoice.paymentRequestId = paymentRequest._id;
        await invoice.save({ session });
      }

      installment.invoiceNumber = invoice.invoiceNumber;
      await project.save({ session });

      // Link invoice to the payment request
      paymentRequest.invoiceId = invoice._id;
      paymentRequest.invoiceNumber = invoice.invoiceNumber;
      await paymentRequest.save({ session });

      result = {
        paymentRequestId: paymentRequest._id,
        status: paymentRequest.status,
        installment: {
          _id: installment._id,
          title: installment.title,
          expectedAmount: expected,
          previouslyPaid: previousPaid,
          paidNow: paid,
          totalPaidOnInstallment: installment.paidAmount,
          paymentStatus: installment.paymentStatus,
        },
        invoice: {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          tax: invoice.tax,
          totalAmount: invoice.totalAmount,
          status: invoice.status,
        },
        project: {
          projectId: project.projectId,
          projectCost: project.projectCost,
          totalPaid: project.totalPaid,
          remainingAmount: project.remainingAmount,
        },
      };
    });

    return res.status(201).json({
      success: true,
      message: "Payment recorded. Project totals updated.",
      data: result,
    });
  } catch (error) {
    console.error("createPaymentRequest error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to record payment",
    });
  } finally {
    await session.endSession();
  }
};

/* ================================================================
 * 2. ADMIN — LIST PAYMENT RECORDS
 *    GET /api/payment-requests?projectId=...&installmentId=...
 *    GET /api/payment-requests/admin/all
 * ================================================================ */
exports.getPaymentRequests = async (req, res) => {
  try {
    const { projectId, clientId, installmentId, status } = req.query;
    const filter = {};

    if (projectId) {
      if (mongoose.Types.ObjectId.isValid(projectId)) {
        filter.projectId = projectId;
      } else {
        const proj = await Project.findOne({ projectId }).select("_id");
        if (!proj) {
          return res
            .status(404)
            .json({ success: false, message: "Project not found" });
        }
        filter.projectId = proj._id;
      }
    }
    if (clientId) filter.clientId = clientId;
    if (installmentId) filter.installmentId = installmentId;
    if (status && ["approved", "rejected", "pending"].includes(status)) {
      filter.status = status;
    }

    const requests = await PaymentRequest.find(filter)
      .populate(
        "projectId",
        "projectId projectName projectCost totalPaid remainingAmount gstPercent clientName mailId mobileNumber",
      )
      .populate("clientId", "name email mobile")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("getPaymentRequests error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================================================
 * 3. ADMIN — GET ONE
 *    GET /api/payment-requests/:id
 * ================================================================ */
exports.getPaymentRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const request = await PaymentRequest.findById(id)
      .populate(
        "projectId",
        "projectId projectName projectCost totalPaid remainingAmount gstPercent clientName mailId mobileNumber",
      )
      .populate("clientId", "name email mobile")
      .populate("reviewedBy", "name email");
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Payment record not found" });
    }
    return res.json({ success: true, data: request });
  } catch (error) {
    console.error("getPaymentRequestById error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================================================
 * 4. ADMIN — EDIT EXISTING PAYMENT RECORD
 *    PATCH /api/payment-requests/:id
 *    Adjusts paidAmount / transactionId / note / image / paymentDate.
 *    Recomputes installment.paidAmount, project.totalPaid,
 *    project.remainingAmount, and invoice.
 * ================================================================ */
exports.updatePaymentRequest = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;

    /* -------------------- Input normalization -------------------- */
    const body = req.body || {};

    // Multer puts repeated fields into arrays; unwrap safely
    const pickScalar = (v) => {
      if (v === undefined || v === null) return undefined;
      if (Array.isArray(v)) return v[0];
      return v;
    };

    const rawPaidAmount = pickScalar(body.paidAmount);
    const rawNote = pickScalar(body.note);
    const rawReason = pickScalar(body.reason);
    const rawTransactionId = pickScalar(body.transactionId);
    const rawPaymentMode = pickScalar(body.paymentMode);
    const rawPaymentDate = pickScalar(body.paymentDate);
    const rawProofImageUrl = pickScalar(body.proofImageUrl);

    // Uploaded file (multipart) overrides proofImageUrl
    let finalProofUrl;
    if (req.file) {
      finalProofUrl = `/uploads/payment-proofs/${req.file.filename}`;
    } else if (rawProofImageUrl !== undefined) {
      finalProofUrl = String(rawProofImageUrl || "").trim();
    }

    console.log("🔄 updatePaymentRequest", {
      id,
      bodyKeys: Object.keys(body),
      paidAmountRaw: rawPaidAmount,
      paidAmountType: typeof rawPaidAmount,
      hasFile: !!req.file,
      file: req.file ? req.file.filename : null,
    });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    /* -------------------- Validate paidAmount -------------------- */
    let newPaid;

    if (
      rawPaidAmount !== undefined &&
      rawPaidAmount !== null &&
      String(rawPaidAmount).trim() !== ""
    ) {
      const parsed = Number(String(rawPaidAmount).trim());
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return res.status(400).json({
          success: false,
          message: "paidAmount must be a positive number",
        });
      }
      newPaid = Number(parsed.toFixed(2));
    }
    // If paidAmount not provided → leave old value untouched

    /* -------------------- Transaction -------------------- */
    let result;

    await session.withTransaction(async () => {
      const record = await PaymentRequest.findById(id).session(session);
      if (!record) throw new Error("Payment record not found");

      const project = await Project.findById(record.projectId).session(
        session,
      );
      if (!project) throw new Error("Project not found");

      const inst = project.installments.id(record.installmentId);
      if (!inst) throw new Error("Installment not found");

      const expected = Number(record.installmentExpectedAmount);
      const oldPaid = Number(record.paidAmount || 0);
      const targetPaid = newPaid !== undefined ? newPaid : oldPaid;

      /* -------------------- Delta & guards -------------------- */
      const delta = Number((targetPaid - oldPaid).toFixed(2));
      const newInstPaid = Number(
        (Number(inst.paidAmount || 0) + delta).toFixed(2),
      );

      if (newInstPaid < 0) {
        throw new Error("Adjusted amount would make installment negative");
      }
      if (newInstPaid > expected + 0.01) {
        throw new Error(
          `Overpay not allowed. Expected ₹${expected.toFixed(2)}, ` +
            `installment total would be ₹${newInstPaid.toFixed(2)}`,
        );
      }

      /* -------------------- Update record -------------------- */
      record.paidAmount = Number(targetPaid.toFixed(2));

      if (rawNote !== undefined || rawReason !== undefined) {
        record.reason = String(rawNote ?? rawReason ?? "").trim();
      }
      if (rawTransactionId !== undefined) {
        record.transactionId = String(rawTransactionId || "").trim();
      }
      if (rawPaymentMode !== undefined && rawPaymentMode !== "") {
        record.paymentMode = rawPaymentMode;
      }
      if (rawPaymentDate !== undefined && rawPaymentDate !== "") {
        record.paymentDate = new Date(rawPaymentDate);
      }
      if (finalProofUrl !== undefined) {
        record.proofImageUrl = finalProofUrl;
      }

      // Keep it approved; admin edits override old pending/rejected states
      if (!["approved", "pending"].includes(record.status)) {
        record.status = "approved";
      }

      await record.save({ session });

      /* -------------------- Update installment -------------------- */
      inst.paidAmount = newInstPaid;

      if (newInstPaid + 0.01 >= expected) {
        inst.paymentStatus = "paid";
        inst.status = "paid";
      } else if (newInstPaid > 0) {
        inst.paymentStatus = "partial_approved";
        inst.status = "pending";
      } else {
        inst.paymentStatus = "unpaid";
        inst.status = "pending";
        inst.paymentDate = null;
      }

      project.calculatePaymentSummary();
      await project.save({ session });

      /* -------------------- Recompute invoice from all approved records -------------------- */
      const allApproved = await PaymentRequest.find({
        installmentId: inst._id,
        status: "approved",
      }).session(session);

      const totalPaidAll = Number(
        allApproved
          .reduce((sum, r) => sum + Number(r.paidAmount || 0), 0)
          .toFixed(2),
      );

      const gstRate = Number(project.gstPercent || 0);
      const gstAmount = Number(((totalPaidAll * gstRate) / 100).toFixed(2));
      const totalWithGst = Number((totalPaidAll + gstAmount).toFixed(2));

      let invoice = await Invoice.findOne({
        projectId: project._id,
        installmentId: inst._id,
      }).session(session);

      if (totalPaidAll <= 0) {
        // No more payments → remove invoice
        if (invoice) {
          await Invoice.findByIdAndDelete(invoice._id).session(session);
          invoice = null;
        }
        inst.invoiceNumber = "";
        await project.save({ session });
      } else if (invoice) {
        invoice.amount = Number(totalPaidAll.toFixed(2));
        invoice.tax = gstAmount;
        invoice.totalAmount = totalWithGst;
        invoice.paymentDate = record.paymentDate || new Date();
        if (record.transactionId) {
          invoice.transactionId = record.transactionId;
        }
        if (record.paymentMode) {
          invoice.paymentMode = record.paymentMode;
        }
        invoice.paymentRequestId = record._id;
        await invoice.save({ session });
      } else {
        invoice = new Invoice({
          projectId: project._id,
          clientId: project.clientId,
          installmentId: inst._id,
          installmentTitle: inst.title,
          sacCode: inst.sacCode || "",
          gstPercent: gstRate,
          amount: Number(totalPaidAll.toFixed(2)),
          tax: gstAmount,
          totalAmount: totalWithGst,
          status: "paid",
          dueDate: inst.dueDate || null,
          paymentDate: record.paymentDate || new Date(),
          paymentMode: record.paymentMode || "other",
          transactionId: record.transactionId || "",
          paymentRequestId: record._id,
        });
        await invoice.save({ session });
      }

      if (invoice) {
        inst.invoiceNumber = invoice.invoiceNumber;
        await project.save({ session });
      }

      /* -------------------- Result -------------------- */
      result = {
        paymentRequestId: record._id,
        paymentRequest: {
          _id: record._id,
          paidAmount: record.paidAmount,
          reason: record.reason,
          paymentMode: record.paymentMode,
          transactionId: record.transactionId,
          proofImageUrl: record.proofImageUrl,
          paymentDate: record.paymentDate,
          status: record.status,
        },
        installment: {
          _id: inst._id,
          title: inst.title,
          expectedAmount: expected,
          paidAmount: inst.paidAmount,
          paymentStatus: inst.paymentStatus,
        },
        invoice: invoice
          ? {
              _id: invoice._id,
              invoiceNumber: invoice.invoiceNumber,
              amount: invoice.amount,
              tax: invoice.tax,
              totalAmount: invoice.totalAmount,
              status: invoice.status,
            }
          : null,
        project: {
          projectId: project.projectId,
          projectCost: project.projectCost,
          totalPaid: project.totalPaid,
          remainingAmount: project.remainingAmount,
        },
      };
    });

    return res.json({
      success: true,
      message: "Payment record updated. Project totals refreshed.",
      data: result,
    });
  } catch (error) {
    console.error("updatePaymentRequest error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update payment record",
    });
  } finally {
    await session.endSession();
  }
};


/* ================================================================
 * 5. ADMIN — DELETE PAYMENT RECORD
 *    DELETE /api/payment-requests/:id
 *    Rolls back installment.paidAmount, project.totalPaid,
 *    and reduces the invoice accordingly.
 * ================================================================ */
exports.deletePaymentRequest = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    let result;

    await session.withTransaction(async () => {
      const record = await PaymentRequest.findById(id).session(session);
      if (!record) throw new Error("Payment record not found");

      const project = await Project.findById(record.projectId).session(
        session,
      );
      if (!project) throw new Error("Project not found");

      const inst = project.installments.id(record.installmentId);
      if (!inst) throw new Error("Installment not found");

      const expected = Number(record.installmentExpectedAmount);
      const amountToRemove = Number(record.paidAmount || 0);
      const newInstPaid = Number(
        Math.max(0, Number(inst.paidAmount || 0) - amountToRemove).toFixed(2),
      );

      // Roll back installment
      inst.paidAmount = newInstPaid;
      if (newInstPaid + 0.01 >= expected) {
        inst.paymentStatus = "paid";
        inst.status = "paid";
      } else if (newInstPaid > 0) {
        inst.paymentStatus = "partial_approved";
        inst.status = "pending";
      } else {
        inst.paymentStatus = "unpaid";
        inst.status = "pending";
        inst.paymentDate = null;
      }

      project.calculatePaymentSummary();
      await project.save({ session });

      // Reduce invoice
      let invoice = await Invoice.findOne({
        projectId: project._id,
        installmentId: inst._id,
      }).session(session);

      if (invoice) {
        const remainingRecords = await PaymentRequest.find({
          installmentId: inst._id,
          status: "approved",
          _id: { $ne: record._id },
        }).session(session);

        const totalPaidRemaining = remainingRecords.reduce(
          (s, r) => s + Number(r.paidAmount || 0),
          0,
        );

        if (totalPaidRemaining <= 0) {
          await Invoice.findByIdAndDelete(invoice._id).session(session);
          invoice = null;
        } else {
          const gstRate = Number(project.gstPercent || 0);
          const gstAmount = Number(
            ((totalPaidRemaining * gstRate) / 100).toFixed(2),
          );
          invoice.amount = Number(totalPaidRemaining.toFixed(2));
          invoice.tax = gstAmount;
          invoice.totalAmount = Number(
            (totalPaidRemaining + gstAmount).toFixed(2),
          );
          await invoice.save({ session });
        }
      }

      // Delete the record
      await PaymentRequest.findByIdAndDelete(record._id).session(session);

      result = {
        deletedPaymentRequestId: record._id,
        installment: {
          _id: inst._id,
          paidAmount: inst.paidAmount,
          paymentStatus: inst.paymentStatus,
        },
        project: {
          projectId: project.projectId,
          projectCost: project.projectCost,
          totalPaid: project.totalPaid,
          remainingAmount: project.remainingAmount,
        },
        invoiceDeleted: invoice === null,
      };
    });

    return res.json({
      success: true,
      message: "Payment record deleted. Project totals rolled back.",
      data: result,
    });
  } catch (error) {
    console.error("deletePaymentRequest error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to delete payment record",
    });
  } finally {
    await session.endSession();
  }
};

/* ================================================================
 * 6. ADMIN — LIST ALL (dashboard, same as getPaymentRequests)
 *    GET /api/payment-requests/admin/all
 * ================================================================ */
exports.getAdminPaymentRequests = async (req, res) => {
  try {
    const { status, projectId, clientId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && ["approved", "rejected", "pending"].includes(status)) {
      filter.status = status;
    }
    if (projectId) filter.projectId = projectId;
    if (clientId) filter.clientId = clientId;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

    const total = await PaymentRequest.countDocuments(filter);
    const requests = await PaymentRequest.find(filter)
      .populate(
        "projectId",
        "projectId projectName projectCost totalPaid remainingAmount gstPercent",
      )
      .populate("clientId", "name email mobile")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      data: requests,
    });
  } catch (error) {
    console.error("getAdminPaymentRequests error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================================================
 * 7. ADMIN — STATS
 *    GET /api/payment-requests/admin/stats
 * ================================================================ */
exports.getPaymentRequestStats = async (req, res) => {
  try {
    const [pending, approved, rejected, aggApproved] = await Promise.all([
      PaymentRequest.countDocuments({ status: "pending" }),
      PaymentRequest.countDocuments({ status: "approved" }),
      PaymentRequest.countDocuments({ status: "rejected" }),
      PaymentRequest.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: null, total: { $sum: "$paidAmount" } } },
      ]),
    ]);
    return res.json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        totalRecordedAmount: aggApproved[0]?.total || 0,
        asOf: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("getPaymentRequestStats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================================================
 * BACKWARD-COMPAT STUBS
 * These were the old client-side endpoints. Kept so old route files
 * don't crash with "undefined is not a function".
 * ================================================================ */

exports.cancelPaymentRequest = async (req, res) => {
  // Delegates to delete
  return exports.deletePaymentRequest(req, res);
};

exports.reviewPaymentRequest = async (req, res) => {
  // No longer used — payments are auto-approved when admin records them
  return res.status(410).json({
    success: false,
    message:
      "reviewPaymentRequest is deprecated. Use PATCH /api/payment-requests/:id to edit a record.",
  });
};