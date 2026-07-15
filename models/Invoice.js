// models/Invoice.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { 
        type: String, 
        unique: true,
        required: true,
        default: function() {
            const year = new Date().getFullYear();
            const timestamp = Date.now().toString().slice(-6);
            return `TEMP${year}${timestamp}`;
        }
    },
    projectId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project',
        required: true 
    },
    clientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Client',
        required: true 
    },
    installmentId: { 
        type: mongoose.Schema.Types.ObjectId,
        required: true 
    },
    installmentTitle: { type: String, required: true },
    amount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['generated', 'sent', 'paid', 'overdue'],
        default: 'generated'
    },
    dueDate: { type: Date },
    paymentDate: { type: Date },
    paymentMode: { type: String },
    transactionId: { type: String },
    invoicePdf: {
        type: String,
        default: ''
    },
    invoicePdfURL:{
        type: String,
        default: ''
    },
    sentAt: { type: Date }
}, { timestamps: true });

// ✅ FIXED: Generate invoice number with proper sequence
invoiceSchema.pre('save', async function(next) {
    try {
        if (!this.invoiceNumber || this.invoiceNumber.startsWith('TEMP')) {
            const Invoice = mongoose.model('Invoice');
            
            // Get current year
            const year = new Date().getFullYear();
            
            // Find the highest invoice number for this year
            const lastInvoice = await Invoice.findOne({
                invoiceNumber: { $regex: `^PMSINV${year}` }
            }).sort({ invoiceNumber: -1 });
            
            let sequence = 1;
            if (lastInvoice) {
                // Extract sequence number from last invoice
                const lastSeq = parseInt(lastInvoice.invoiceNumber.replace(`PMSINV${year}`, ''));
                sequence = lastSeq + 1;
            }
            
            // Format: PMSINV20260005
            const seqStr = String(sequence).padStart(4, '0');
            this.invoiceNumber = `PMSINV${year}${seqStr}`;
            
            console.log(`✅ Generated invoice number: ${this.invoiceNumber}`);
        }
        next();
    } catch (error) {
        console.error('❌ Error generating invoice number:', error);
        // Fallback with timestamp
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-6);
        this.invoiceNumber = `PMSINV${year}${timestamp}`;
        next();
    }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;