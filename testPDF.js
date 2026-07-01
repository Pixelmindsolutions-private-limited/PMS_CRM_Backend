// testPDF.js
const { generatePDFReceipt } = require('./services/pdfService');
const fs = require('fs');
const path = require('path');

// ============ STATIC TEST DATA ============
const testInvoice = {
    invoiceNumber: 'PMSINV20260010',
    amount: 20000,
    tax: 3600,
    totalAmount: 23600,
    installmentTitle: 'Final Deployment Payment',
    status: 'sent',
    paymentDate: new Date('2026-07-01'),
    paymentMode: 'Cash',
    transactionId: 'TXN123456789'
};

const testProject = {
    projectName: 'E-Commerce Website Development',
    projectId: 'PMSPRJ0001',
    category: 'website'
};

const testClient = {
    name: 'John Doe',
    mobile: '+1234567890',
    email: 'john@example.com',
    address: '123 Main Street, New York, NY 10001'
};

// ============ GENERATE PDF ============
async function generateTestPDF() {
    try {
        console.log('🔄 Generating test PDF...');
        
        const pdfBuffer = await generatePDFReceipt(
            testInvoice,
            testProject,
            testClient
        );

        // Save PDF to file
        const outputPath = path.join(__dirname, 'test-invoice.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);
        
        console.log(`✅ PDF generated successfully!`);
        console.log(`📁 File saved at: ${outputPath}`);
        console.log(`📄 Invoice Number: ${testInvoice.invoiceNumber}`);
        console.log(`👤 Client: ${testClient.name}`);
        console.log(`💰 Amount: ₹${testInvoice.totalAmount}`);
        
        // Get file size
        const stats = fs.statSync(outputPath);
        console.log(`📦 File Size: ${(stats.size / 1024).toFixed(2)} KB`);
        
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
    }
}

// ============ RUN ============
generateTestPDF();