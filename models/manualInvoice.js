// models/ManualInvoice.js
const mongoose = require('mongoose');

const manualInvoiceSchema = new mongoose.Schema({
    invoiceNumber: { 
        type: String,
        unique: true,
        sparse: true  
    },
    clientName: { 
        type: String, 
        required: true 
    },
    clientMobile: { 
        type: String, 
        required: true 
    },
    clientAddress: { 
        type: String, 
        default: '' 
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    items: [{
        description: { 
            type: String, 
            required: true 
        },
        price: { 
            type: Number, 
            required: true,
            min: 0 
        },
        quantity: { 
            type: Number, 
            required: true,
            min: 1,
            default: 1 
        },
        total: { 
            type: Number, 
            required: true 
        }
    }],
    subtotal: { 
        type: Number, 
        required: true 
    },
    totalAmount: { 
        type: Number, 
        required: true 
    },
    invoicePdf: {
        type: String,
        default: ''
    },
    invoicePdfURL: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    }
}, { timestamps: true });

manualInvoiceSchema.pre('save', async function(next) {
    try {
        if (!this.invoiceNumber) {
            const ManualInvoice = mongoose.model('ManualInvoice');
            const year = new Date().getFullYear();
            
            console.log(`🔍 Looking for last invoice for year ${year}`);
            
            // Option 1: Try with regex
            const lastInvoice = await ManualInvoice.findOne({
                invoiceNumber: { $regex: `^MINV${year}` }
            }).sort({ invoiceNumber: -1 });
            
            console.log(`📋 Last invoice found:`, lastInvoice?.invoiceNumber || 'None');
            
            let sequence = 1;
            if (lastInvoice) {
                const lastSeq = parseInt(lastInvoice.invoiceNumber.replace(`MINV${year}`, ''));
                console.log(`📊 Extracted sequence: ${lastSeq}`);
                if (!isNaN(lastSeq)) {
                    sequence = lastSeq + 1;
                }
            }
            
            const seqStr = String(sequence).padStart(4, '0');
            this.invoiceNumber = `MINV${year}${seqStr}`;
            
            console.log(`✅ Generated invoice number: ${this.invoiceNumber}`);
        }
        next();
    } catch (error) {
        console.error('❌ Error generating invoice number:', error);
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-6);
        this.invoiceNumber = `MINV${year}${timestamp}`;
        next();
    }
});

// Auto-calculate totals before save
manualInvoiceSchema.pre('save', function(next) {
    // Calculate item totals
    this.items = this.items.map(item => ({
        ...item,
        total: item.price * item.quantity
    }));
    
    // Calculate subtotal
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    
    // Total amount = subtotal (no tax)
    this.totalAmount = this.subtotal;
    
    next();
});

const ManualInvoice = mongoose.model('ManualInvoice', manualInvoiceSchema);
module.exports = ManualInvoice;