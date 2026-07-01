// services/pdfService.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate PDF Invoice with exact design as per your image
const generatePDFReceipt = (invoice, project, client) => {
    return new Promise((resolve, reject) => {
        try {
            // Register logo image if exists
            let logoImage = null;
            const logoPath = path.join(__dirname, '../uploads/logo.png');
            if (fs.existsSync(logoPath)) {
                try {
                    logoImage = doc.openImage(logoPath);
                } catch (imgError) {
                    console.log('Logo image not found, using text fallback');
                }
            }

            const doc = new PDFDocument({
                margin: 0,
                size: 'A4',
                layout: 'portrait'
            });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // ============ COLORS ============
            const primaryColor = '#1a6354';
            const lightBg = '#f8fafc';
            const textDark = '#1e293b';
            const textMuted = '#64748b';
            const white = '#ffffff';
            const borderColor = '#e2e8f0';

            const pageWidth = 595.28;
            const pageHeight = 841.89;
            const margin = 40;
            const contentWidth = pageWidth - (margin * 2);

            // ============ HEADER SECTION ============
            let currentY = 40;

            // Top border line
            doc.rect(margin, currentY, contentWidth, 2).fill(primaryColor);
            currentY += 15;

            // ============ COMPANY NAME ============
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .fillColor(textDark)
                .text('Pixel Mind', margin, currentY);

            doc.fontSize(9)
                .font('Helvetica')
                .fillColor(textMuted)
                .text('Hyderabad, India', margin, currentY + 28);
            currentY += 50;

            // ============ INVOICE TITLE AND GST ============
            doc.fontSize(28)
                .font('Helvetica-Bold')
                .fillColor(textDark)
                .text('INVOICE', pageWidth - margin - 150, 40, { align: 'right' });

            doc.fontSize(9)
                .font('Helvetica')
                .fillColor(textMuted)
                .text('GST NUMBER : 36AAPCP4657A1ZA', pageWidth - margin - 150, 70, { align: 'right' });

            // ============ INVOICE TO ============
            currentY = 120;

            doc.fontSize(10)
                .font('Helvetica-Bold')
                .fillColor(textDark)
                .text('Invoice To', margin, currentY);

            currentY += 16;

            doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor(textDark)
                .text(client.name || 'Zyron infotech Private Limited', margin, currentY);

            currentY += 20;

            doc.fontSize(9)
                .font('Helvetica')
                .fillColor(textMuted)
                .text(client.mobile || '+919949537475', margin, currentY);

            currentY += 14;

            if (client.address) {
                doc.text(client.address || 'Hyderabad, Kphb', margin, currentY);
                currentY += 14;
            }

            // ============ INVOICE NUMBER & DATE ============
            const infoX = pageWidth - margin - 180;

            doc.fontSize(9)
                .font('Helvetica-Bold')
                .fillColor(textMuted)
                .text('Invoice No:', infoX, 120);

            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor(textDark)
                .text(invoice.invoiceNumber || 'PMS22022501', infoX, 134);

            doc.fontSize(9)
                .font('Helvetica-Bold')
                .fillColor(textMuted)
                .text('Date:', infoX, 156);

            const dateStr = invoice.paymentDate
                ? new Date(invoice.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor(textDark)
                .text(dateStr || '14 June 2026', infoX, 170);

            // ============ TABLE ============
            const tableY = 230;

            // Table Headers
            doc.rect(margin, tableY, contentWidth, 28).fill(primaryColor);

            const col1 = margin + 10;
            const col2 = margin + 220;
            const col3 = margin + 370;
            const col4 = margin + 430;

            doc.fontSize(9)
                .font('Helvetica-Bold')
                .fillColor(white);

            doc.text('ITEM DESCRIPTION', col1, tableY + 8);
            doc.text('UNIT PRICE', col2, tableY + 8, { align: 'center', width: 90 });
            doc.text('QUANTITY', col3, tableY + 8, { align: 'center', width: 60 });
            doc.text('AMOUNT', col4, tableY + 8, { align: 'right', width: 100 });

            let rowY = tableY + 28;

            // ============ ITEM ROW ============
            doc.rect(margin, rowY, contentWidth, 28).fill(lightBg);

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor(textDark);

            doc.text(invoice.installmentTitle || 'Flutter Developer', col1, rowY + 7);
            doc.text(`₹${invoice.amount.toFixed(2)}`, col2, rowY + 7, { align: 'center', width: 90 });
            doc.text('01', col3, rowY + 7, { align: 'center', width: 60 });
            doc.text(`₹${invoice.amount.toFixed(2)}`, col4, rowY + 7, { align: 'right', width: 100 });

            rowY += 28;

            // ============ TOTAL ROW ============
            doc.rect(margin, rowY, contentWidth, 28).fill(lightBg);

            doc.fontSize(10)
                .font('Helvetica-Bold')
                .fillColor(textDark);

            doc.text('TOTAL', col1, rowY + 7);
            doc.text('', col2, rowY + 7, { align: 'center', width: 90 });
            doc.text('', col3, rowY + 7, { align: 'center', width: 60 });
            doc.text(`₹${invoice.amount.toFixed(2)}`, col4, rowY + 7, { align: 'right', width: 100 });

            rowY += 28;

            // ============ GST ROW ============
            doc.rect(margin, rowY, contentWidth, 28).fill(white);

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor(textDark);

            doc.text('GST (18%)', col1, rowY + 7);
            doc.text('', col2, rowY + 7, { align: 'center', width: 90 });
            doc.text('', col3, rowY + 7, { align: 'center', width: 60 });
            doc.text(`₹${invoice.tax.toFixed(2)}`, col4, rowY + 7, { align: 'right', width: 100 });

            rowY += 28;

            // ============ SUB TOTAL ROW ============
            doc.rect(margin, rowY, contentWidth, 28).fill(lightBg);

            doc.fontSize(10)
                .font('Helvetica-Bold')
                .fillColor(textDark);

            doc.text('SUB TOTAL', col1, rowY + 7);
            doc.text('', col2, rowY + 7, { align: 'center', width: 90 });
            doc.text('', col3, rowY + 7, { align: 'center', width: 60 });
            doc.text(`₹${invoice.totalAmount.toFixed(2)}`, col4, rowY + 7, { align: 'right', width: 100 });

            rowY += 28;

            // ============ TOTAL AMOUNT ============
            doc.rect(margin, rowY, contentWidth, 35).fill(primaryColor);

            doc.fontSize(16)
                .font('Helvetica-Bold')
                .fillColor(white);

            doc.text('TOTAL', col1, rowY + 9);
            doc.text(`₹${invoice.totalAmount.toFixed(2)}`, col4, rowY + 9, { align: 'right', width: 100 });

            // ============ SIGNATURE ============
            const signY = rowY + 70;

            doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor(textDark)
                .text('K.Narasimha Varma', pageWidth - margin - 160, signY, { align: 'center', width: 150 });

            const badgeWidth = 80;
            const badgeHeight = 20;
            const badgeX = pageWidth - margin - 160 + 35;
            const badgeY = signY + 24;

            doc.rect(badgeX, badgeY, badgeWidth, badgeHeight).fill(primaryColor);

            doc.fontSize(8)
                .font('Helvetica-Bold')
                .fillColor(white)
                .text('DIRECTOR', badgeX + 12, badgeY + 5, { width: 56, align: 'center' });

            // ============ FOOTER ============
            const footerY = pageHeight - 50;

            doc.rect(margin, footerY, contentWidth, 1).fill(borderColor);

            doc.fontSize(8)
                .font('Helvetica')
                .fillColor(textMuted)
                .text('Thank you for your business!', pageWidth / 2, footerY + 12, { align: 'center' });

            doc.end();
        } catch (error) {
            console.error('PDF Generation Error:', error);
            reject(error);
        }
    });
};

module.exports = { generatePDFReceipt };