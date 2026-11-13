// routes/paymentRequestRoutes.js
const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth.middleware");
const { uploadPaymentProof } = require("../middleware/paymentUpload");
const ctrl = require("../controllers/paymentRequestController");

/* ============================================================
 * ADMIN — RECORD PAYMENT (offline collection)
 * ============================================================ */
router.post(
  "/",
  protect,
  adminOnly,
  uploadPaymentProof.single("proof"),
  ctrl.createPaymentRequest,
);

/* ============================================================
 * ADMIN — DASHBOARD (before "/:id")
 * ============================================================ */
router.get("/admin/all", protect, adminOnly, ctrl.getAdminPaymentRequests);
router.get("/admin/stats", protect, adminOnly, ctrl.getPaymentRequestStats);

/* ============================================================
 * LIST / DETAIL
 * ============================================================ */
router.get("/", protect, adminOnly, ctrl.getPaymentRequests);
router.get("/:id", protect, adminOnly, ctrl.getPaymentRequestById);

/* ============================================================
 * ADMIN — EDIT PAYMENT RECORD  ⚠️ MUST HAVE multer middleware
 * ============================================================ */
router.patch(
  "/:id",
  protect,
  adminOnly,
  uploadPaymentProof.single("proof"),   // ← THIS LINE IS ESSENTIAL
  ctrl.updatePaymentRequest,
);

/* ============================================================
 * ADMIN — DELETE PAYMENT RECORD
 * ============================================================ */
router.delete("/:id", protect, adminOnly, ctrl.deletePaymentRequest);

module.exports = router;