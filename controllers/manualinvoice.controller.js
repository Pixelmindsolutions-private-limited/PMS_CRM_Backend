// controllers/manualinvoice.controller.js
const ManualInvoice = require('../models/manualInvoice');
const fs = require('fs');
const path = require('path');
const { generateManualInvoicePDF } = require('../services/manualpdfService');

// ============ CREATE MANUAL INVOICE ============
exports.createManualInvoice = async (req, res) => {
    try {
        const { 
            clientName, 
            clientMobile, 
            clientAddress, 
            date,
            items
        } = req.body;

        // Validate required fields
        if (!clientName || !clientMobile) {
            return res.status(400).json({
                success: false,
                message: 'Client name and mobile are required'
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one item is required'
            });
        }

        // Validate items
        for (const item of items) {
            if (!item.description || !item.price || !item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have description, price, and quantity'
                });
            }
            if (item.price <= 0 || item.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Price and quantity must be greater than 0'
                });
            }
        }

        // Calculate subtotal
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create invoice
        const invoice = new ManualInvoice({
            clientName,
            clientMobile,
            clientAddress: clientAddress || '',
            date: date || new Date(),
            items: items.map(item => ({
                description: item.description,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            subtotal,
            totalAmount: subtotal,
            createdBy: req.user?._id || null
        });

        await invoice.save();

        // ============ GENERATE AND SAVE PDF ============
        const pdfBuffer = await generateManualInvoicePDF(invoice);

        // Create uploads/manualinvoices directory if it doesn't exist
        const invoicesDir = path.join(__dirname, '../uploads/manualinvoices');
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
        }

        const pdfFileName = `manual-invoice-${invoice.invoiceNumber}.pdf`;
        const pdfPath = path.join(invoicesDir, pdfFileName);
        fs.writeFileSync(pdfPath, pdfBuffer);

        // Generate URL
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const pdfUrl = `${baseUrl}/uploads/manualinvoices/${pdfFileName}`;

        // Update invoice with PDF paths
        invoice.invoicePdf = pdfPath;
        invoice.invoicePdfURL = pdfUrl;
        await invoice.save();

        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            data: {
                _id: invoice._id,
                invoiceNumber: invoice.invoiceNumber,
                clientName: invoice.clientName,
                clientMobile: invoice.clientMobile,
                clientAddress: invoice.clientAddress,
                date: invoice.date,
                items: invoice.items,
                subtotal: invoice.subtotal,
                totalAmount: invoice.totalAmount,
                invoicePdfURL: invoice.invoicePdfURL,
                createdAt: invoice.createdAt,
                updatedAt: invoice.updatedAt
            }
        });

    } catch (error) {
        console.error('Create manual invoice error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ GET MANUAL INVOICES ============
exports.getManualInvoices = async (req, res) => {
    try {
        const { 
            id,
            invoiceNumber,
            page = 1, 
            limit = 10, 
            clientName,
            startDate,
            endDate
        } = req.query;

        if (id) {
            const invoice = await ManualInvoice.findById(id);
            
            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
            }

            return res.json({
                success: true,
                data: invoice
            });
        }

        if (invoiceNumber) {
            const invoice = await ManualInvoice.findOne({ invoiceNumber });
            
            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
            }

            return res.json({
                success: true,
                data: invoice
            });
        }

        const query = {};

        if (clientName) {
            query.clientName = { $regex: clientName, $options: 'i' };
        }
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const total = await ManualInvoice.countDocuments(query);
        const invoices = await ManualInvoice.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const totalAmount = await ManualInvoice.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        res.json({
            success: true,
            data: invoices,
            total: invoices.length,
            totalAmount: totalAmount[0]?.total || 0,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
                total
            }
        });

    } catch (error) {
        console.error('Get manual invoices error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ UPDATE MANUAL INVOICE ============
exports.updateManualInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            clientName, 
            clientMobile, 
            clientAddress, 
            date,
            items
        } = req.body;

        const invoice = await ManualInvoice.findById(id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // Update fields
        if (clientName) invoice.clientName = clientName;
        if (clientMobile) invoice.clientMobile = clientMobile;
        if (clientAddress !== undefined) invoice.clientAddress = clientAddress;
        if (date) invoice.date = date;

        // Update items and recalculate
        if (items && items.length > 0) {
            invoice.items = items.map(item => ({
                description: item.description,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            }));

            const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
            invoice.subtotal = subtotal;
            invoice.totalAmount = subtotal;
        }

        await invoice.save();

        // Regenerate PDF
        try {
            const pdfBuffer = await generateManualInvoicePDF(invoice);
            
            const invoicesDir = path.join(__dirname, '../uploads/manualinvoices');
            if (!fs.existsSync(invoicesDir)) {
                fs.mkdirSync(invoicesDir, { recursive: true });
            }

            const pdfFileName = `manual-invoice-${invoice.invoiceNumber}.pdf`;
            const pdfPath = path.join(invoicesDir, pdfFileName);
            fs.writeFileSync(pdfPath, pdfBuffer);

            const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
            const pdfUrl = `${baseUrl}/uploads/manualinvoices/${pdfFileName}`;

            invoice.invoicePdf = pdfPath;
            invoice.invoicePdfURL = pdfUrl;
            await invoice.save();
        } catch (pdfError) {
            console.error('PDF regeneration error:', pdfError);
        }

        res.json({
            success: true,
            message: 'Invoice updated successfully',
            data: invoice
        });

    } catch (error) {
        console.error('Update manual invoice error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ DELETE MANUAL INVOICE ============
exports.deleteManualInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await ManualInvoice.findById(id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // Delete PDF file if exists
        if (invoice.invoicePdf && fs.existsSync(invoice.invoicePdf)) {
            fs.unlinkSync(invoice.invoicePdf);
        }

        await ManualInvoice.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Invoice deleted successfully'
        });

    } catch (error) {
        console.error('Delete manual invoice error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============ DOWNLOAD INVOICE PDF ============
exports.downloadInvoicePDF = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await ManualInvoice.findById(id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // Check if PDF exists
        if (!invoice.invoicePdf || !fs.existsSync(invoice.invoicePdf)) {
            // Generate PDF if not exists
            const pdfBuffer = await generateManualInvoicePDF(invoice);
            
            const invoicesDir = path.join(__dirname, '../uploads/manualinvoices');
            if (!fs.existsSync(invoicesDir)) {
                fs.mkdirSync(invoicesDir, { recursive: true });
            }

            const pdfFileName = `manual-invoice-${invoice.invoiceNumber}.pdf`;
            const pdfPath = path.join(invoicesDir, pdfFileName);
            fs.writeFileSync(pdfPath, pdfBuffer);

            const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
            const pdfUrl = `${baseUrl}/uploads/manualinvoices/${pdfFileName}`;

            invoice.invoicePdf = pdfPath;
            invoice.invoicePdfURL = pdfUrl;
            await invoice.save();
        }

        res.download(invoice.invoicePdf, `invoice-${invoice.invoiceNumber}.pdf`);

    } catch (error) {
        console.error('Download PDF error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

