// models/Invoice.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { 
        type: String, 
        unique: true,
        required: true,
        default: function() {
            // Temporary default to avoid validation error
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
    invoicePdf: { type: String },
    sentAt: { type: Date }
}, { timestamps: true });

// ✅ Generate invoice number before saving
invoiceSchema.pre('save', async function(next) {
    try {
        // Always generate a proper invoice number
        const Invoice = mongoose.model('Invoice');
        const count = await Invoice.countDocuments();
        const year = new Date().getFullYear();
        const seq = String(count + 1).padStart(4, '0');
        
        // Format: PMSINV20260001
        this.invoiceNumber = `PMSINV${year}${seq}`;
        
        console.log(`✅ Generated invoice number: ${this.invoiceNumber}`);
    } catch (error) {
        console.error('❌ Error generating invoice number:', error);
        // Fallback
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-6);
        this.invoiceNumber = `PMSINV${year}${timestamp}`;
    }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;