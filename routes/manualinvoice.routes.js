// routes/manualInvoiceRoutes.js
const express = require('express');
const router = express.Router();
const manualInvoiceController = require('../controllers/manualinvoice.controller');

router.post('/', manualInvoiceController.createManualInvoice);
router.get('/', manualInvoiceController.getManualInvoices);
router.put('/:id', manualInvoiceController.updateManualInvoice);
router.delete('/:id', manualInvoiceController.deleteManualInvoice);
router.get('/:id/download', manualInvoiceController.downloadInvoicePDF);

module.exports = router;