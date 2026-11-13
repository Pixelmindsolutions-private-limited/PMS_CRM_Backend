// routes/project.routes.js
const express = require("express");
const router = express.Router();

const {
  protect,
  adminOnly,
} = require("../middleware/auth.middleware");

const {
  // Project CRUD
  createProject,
  getAllProjects,
  getProjectById,
  getProjectOptions,
  getProjectStats,
  updateProject,
  deleteProject,
  bulkDeleteProjects,
  restoreProject,
  permanentDeleteProjects,

  // Installments
  addProjectInstallment,
  getInstallments,
  markAsPaid,
  editInstallment,
  deleteInstallment,

  // Reminders
  sendReminders,
  getUpcomingInstallments,
  sendTestReminder,
  getReminderStats,
  getTomorrowReminders,
  debugReminders,

  // Invoices
  getInvoices,
  getInvoiceStats,
  createInvoices,
  getAllInvoices,
} = require("../controllers/project.controller");

/* ============ STATIC ROUTES (must precede "/:id") ============ */
router.get("/stats", protect, getProjectStats);
router.get("/options", protect, getProjectOptions);
router.get("/all", protect, getAllProjects);
router.get("/getinvoices", protect, getAllInvoices);

/* ============ REMINDER ROUTES ============ */
router.post("/sendremainder", protect, adminOnly, sendReminders);
router.get("/upcominginstallments", protect, getUpcomingInstallments);
router.get("/tomorrow", protect, getTomorrowReminders);
router.post("/test/:projectId", protect, adminOnly, sendTestReminder);
router.get("/remainderstats", protect, getReminderStats);
router.get("/debugreminders", protect, adminOnly, debugReminders);

/* ============ INVOICE LIST ROUTES ============ */
router.get("/invoices", protect, getInvoices);
router.get("/invoices/stats", protect, getInvoiceStats);

/* ============ PROJECT CREATE ============ */
router.post("/", protect, adminOnly, createProject);
router.post("/create", protect, adminOnly, createProject);

/* ============ INSTALLMENTS ============ */
router.post(
  "/:projectId/installments",
  protect,
  adminOnly,
  addProjectInstallment,
);
router.get("/:projectId/installments", protect, getInstallments);
router.put(
  "/:projectId/installments/:installmentId",
  protect,
  adminOnly,
  editInstallment,
);
router.delete(
  "/:projectId/installments/:installmentId",
  protect,
  adminOnly,
  deleteInstallment,
);
router.put(
  "/:projectId/installments/:installmentId/mark-paid",
  protect,
  adminOnly,
  markAsPaid,
);

/* ============ INVOICES (nested) ============ */
router.post("/:projectId/invoices", protect, adminOnly, createInvoices);

/* ============ BULK / PERMANENT DELETE ============ */
router.delete("/delete", protect, adminOnly, bulkDeleteProjects);
router.delete("/permanent", protect, adminOnly, permanentDeleteProjects);

/* ============ PROJECT BY ID ============ */
router.get("/:id", protect, getProjectById);
router.put("/:id", protect, adminOnly, updateProject);
router.delete("/:id", protect, adminOnly, deleteProject);
router.put("/:id/restore", protect, adminOnly, restoreProject);

module.exports = router;