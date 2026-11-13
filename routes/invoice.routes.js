// routes/invoice.routes.js
const express = require("express");
const router = express.Router();
const {
  protect,
  adminOnly,
} = require("../middleware/auth.middleware");
const {
  getInvoices,
  getInvoiceStats,
  getAllInvoices,
  updateInvoiceStatus,
} = require("../controllers/project.controller");

router.get("/", protect, getInvoices);
router.get("/stats", protect, getInvoiceStats);
router.get("/all", protect, getAllInvoices);
router.patch("/:invoiceId/status", protect, adminOnly, updateInvoiceStatus);

module.exports = router;