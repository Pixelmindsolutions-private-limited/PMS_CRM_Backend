// // services/pdfService.js
// const PDFDocument = require('pdfkit');
// const fs = require('fs');
// const path = require('path');

// // Generate PDF Invoice with exact design as per your image
// const generatePDFReceipt = (invoice, project, client) => {
//     return new Promise((resolve, reject) => {
//         try {
//             // Register logo image if exists
//             let logoImage = null;
//             const logoPath = path.join(__dirname, '../uploads/image (18).png');
//             if (fs.existsSync(logoPath)) {
//                 try {
//                     logoImage = doc.openImage(logoPath);
//                 } catch (imgError) {
//                     console.log('Logo image not found, using text fallback');
//                 }
//             }

//             const doc = new PDFDocument({
//                 margin: 0,
//                 size: 'A4',
//                 layout: 'portrait'
//             });
//             const buffers = [];

//             doc.on('data', buffers.push.bind(buffers));
//             doc.on('end', () => {
//                 const pdfData = Buffer.concat(buffers);
//                 resolve(pdfData);
//             });

//             // ============ COLORS ============
//             const primaryColor = '#1a6354';
//             const lightBg = '#f8fafc';
//             const textDark = '#1e293b';
//             const textMuted = '#64748b';
//             const white = '#ffffff';
//             const borderColor = '#e2e8f0';

//             const pageWidth = 595.28;
//             const pageHeight = 841.89;
//             const margin = 40;
//             const contentWidth = pageWidth - (margin * 2);

//             // ============ HEADER SECTION ============
//             let currentY = 40;

//             // Top border line
//             doc.rect(margin, currentY, contentWidth, 2).fill(primaryColor);
//             currentY += 15;

//             // ============ COMPANY NAME ============
//             doc.fontSize(24)
//                 .font('Helvetica-Bold')
//                 .fillColor(textDark)
//                 .text('Pixel Mind', margin, currentY);

//             doc.fontSize(9)
//                 .font('Helvetica')
//                 .fillColor(textMuted)
//                 .text('Hyderabad, India', margin, currentY + 28);
//             currentY += 50;

//             // ============ INVOICE TITLE AND GST ============
//             doc.fontSize(28)
//                 .font('Helvetica-Bold')
//                 .fillColor(textDark)
//                 .text('INVOICE', pageWidth - margin - 150, 40, { align: 'right' });

//             doc.fontSize(9)
//                 .font('Helvetica')
//                 .fillColor(textMuted)
//                 .text('GST NUMBER : 36AAPCP4657A1ZA', pageWidth - margin - 150, 70, { align: 'right' });

//             // ============ INVOICE TO ============
//             currentY = 120;

//             doc.fontSize(10)
//                 .font('Helvetica-Bold')
//                 .fillColor(textDark)
//                 .text('Invoice To', margin, currentY);

//             currentY += 16;

//             doc.fontSize(14)
//                 .font('Helvetica-Bold')
//                 .fillColor(textDark)
//                 .text(client.name || 'Zyron infotech Private Limited', margin, currentY);

//             currentY += 20;

//             doc.fontSize(9)
//                 .font('Helvetica')
//                 .fillColor(textMuted)
//                 .text(client.mobile || '+919949537475', margin, currentY);

//             currentY += 14;

//             if (client.address) {
//                 doc.text(client.address || 'Hyderabad, Kphb', margin, currentY);
//                 currentY += 14;
//             }

//             // ============ INVOICE NUMBER & DATE ============
//             const infoX = pageWidth - margin - 180;

//             doc.fontSize(9)
//                 .font('Helvetica-Bold')
//                 .fillColor(textMuted)
//                 .text('Invoice No:', infoX, 120);

//             doc.fontSize(11)
//                 .font('Helvetica-Bold')
//                 .fillColor(textDark)
//                 .text(invoice.invoiceNumber || 'PMS22022501', infoX, 134);

//             doc.fontSize(9)
//                 .font('Helvetica-Bold')
//                 .fillColor(textMuted)
//                 .text('Date:', infoX, 156);

//             const dateStr = invoice.paymentDate
//                 ? new Date(invoice.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
//                 : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

//             doc.fontSize(11)
//                 .font('Helvetica-Bold')
//                 .fillColor(textDark)
//                 .text(dateStr || '14 June 2026', infoX, 170);

//             // ============ TABLE ============
//             const tableY = 230;

//             // Table Headers
//             doc.rect(margin, tableY, contentWidth, 28).fill(primaryColor);

//             const col1 = margin + 10;
//             const col2 = margin + 220;
//             const col3 = margin + 370;
//             const col4 = margin + 430;

//             doc.fontSize(9)
//                 .font('Helvetica-Bold')
//                 .fillColor(white);

//             doc.text('ITEM DESCRIPTION', col1, tableY + 8);
//             doc.text('UNIT PRICE', col2, tableY + 8, { align: 'center', width: 90 });
//             doc.text('QUANTITY', col3, tableY + 8, { align: 'center', width: 60 });
//             doc.text('AMOUNT', col4, tableY + 8, { align: 'right', width: 100 });

//             let rowY = tableY + 28;

//             // ============ ITEM ROW ============
//             doc.rect(margin, rowY, contentWidth, 28).fill(lightBg);

//             doc.fontSize(10)
//                 .font('Helvetica')
//                 .fillColor(textDark);

//             doc.text(invoice.installmentTitle || 'Flutter Developer', col1, rowY + 7);
//             doc.text(`₹${invoice.amount.toFixed(2)}`, col2, rowY + 7, { align: 'center', width: 90 });
//             doc.text('01', col3, rowY + 7, { align: 'center', width: 60 });
//             doc.text(`₹${invoice.amount.toFixed(2)}`, col4, rowY + 7, { align: 'right', width: 100 });

//             rowY += 28;

//             // ============ TOTAL ROW ============
//             doc.rect(margin, rowY, contentWidth, 28).fill(lightBg);

//             doc.fontSize(10)
//                 .font('Helvetica-Bold')
//                 .fillColor(textDark);

//             doc.text('TOTAL', col1, rowY + 7);
//             doc.text('', col2, rowY + 7, { align: 'center', width: 90 });
//             doc.text('', col3, rowY + 7, { align: 'center', width: 60 });
//             doc.text(`₹${invoice.amount.toFixed(2)}`, col4, rowY + 7, { align: 'right', width: 100 });

//             rowY += 28;

//             // ============ GST ROW ============
//             doc.rect(margin, rowY, contentWidth, 28).fill(white);

//             doc.fontSize(10)
//                 .font('Helvetica')
//                 .fillColor(textDark);

//             doc.text('GST (18%)', col1, rowY + 7);
//             doc.text('', col2, rowY + 7, { align: 'center', width: 90 });
//             doc.text('', col3, rowY + 7, { align: 'center', width: 60 });
//             doc.text(`₹${invoice.tax.toFixed(2)}`, col4, rowY + 7, { align: 'right', width: 100 });

//             rowY += 28;

//             // ============ SUB TOTAL ROW ============
//             doc.rect(margin, rowY, contentWidth, 28).fill(lightBg);

//             doc.fontSize(10)
//                 .font('Helvetica-Bold')
//                 .fillColor(textDark);

//             doc.text('SUB TOTAL', col1, rowY + 7);
//             doc.text('', col2, rowY + 7, { align: 'center', width: 90 });
//             doc.text('', col3, rowY + 7, { align: 'center', width: 60 });
//             doc.text(`₹${invoice.totalAmount.toFixed(2)}`, col4, rowY + 7, { align: 'right', width: 100 });

//             rowY += 28;

//             // ============ TOTAL AMOUNT ============
//             doc.rect(margin, rowY, contentWidth, 35).fill(primaryColor);

//             doc.fontSize(16)
//                 .font('Helvetica-Bold')
//                 .fillColor(white);

//             doc.text('TOTAL', col1, rowY + 9);
//             doc.text(`₹${invoice.totalAmount.toFixed(2)}`, col4, rowY + 9, { align: 'right', width: 100 });

//             // ============ SIGNATURE ============
//             const signY = rowY + 70;

//             doc.fontSize(14)
//                 .font('Helvetica-Bold')
//                 .fillColor(textDark)
//                 .text('K.Narasimha Varma', pageWidth - margin - 160, signY, { align: 'center', width: 150 });

//             const badgeWidth = 80;
//             const badgeHeight = 20;
//             const badgeX = pageWidth - margin - 160 + 35;
//             const badgeY = signY + 24;

//             doc.rect(badgeX, badgeY, badgeWidth, badgeHeight).fill(primaryColor);

//             doc.fontSize(8)
//                 .font('Helvetica-Bold')
//                 .fillColor(white)
//                 .text('DIRECTOR', badgeX + 12, badgeY + 5, { width: 56, align: 'center' });

//             // ============ FOOTER ============
//             const footerY = pageHeight - 50;

//             doc.rect(margin, footerY, contentWidth, 1).fill(borderColor);

//             doc.fontSize(8)
//                 .font('Helvetica')
//                 .fillColor(textMuted)
//                 .text('Thank you for your business!', pageWidth / 2, footerY + 12, { align: 'center' });

//             doc.end();
//         } catch (error) {
//             console.error('PDF Generation Error:', error);
//             reject(error);
//         }
//     });
// };

// module.exports = { generatePDFReceipt };



// services/pdfService.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ============ LOGO LOADER ============
async function getLogoSrc() {
    const candidatePaths = [
        path.join(__dirname, '../uploads/logo.png'),
        path.join(__dirname, '../uploads/image (18).png'),
        path.join(__dirname, '../uploads', 'image (18).png'),
        path.join(process.cwd(), 'uploads/image (18).png'),
        process.env.COMPANY_LOGO_PATH || ''
    ].filter(Boolean);

    const logoPath = candidatePaths.find(p => fs.existsSync(p));

    if (logoPath) {
        try {
            const logoBase64 = fs.readFileSync(logoPath).toString('base64');
            const ext = (path.extname(logoPath).replace('.', '') || 'png').toLowerCase();
            const mime = ext === 'jpg' ? 'jpeg' : ext;
            console.log(`✅ Logo loaded from: ${logoPath}`);
            return `data:image/${mime};base64,${logoBase64}`;
        } catch (err) {
            console.error(`⚠️ Logo file found but failed to read:`, err.message);
            return null;
        }
    }

    console.warn('⚠️ No logo found. Using text fallback.');
    return null;
}

// ============ HTML TEMPLATE ============
async function buildInvoiceHTML({ invoice, project, client }) {
    // Get all company details from .env
    const companyName = process.env.COMPANY_NAME || 'Pixelmind Solutions Pvt Ltd';
    const [companyFirst, ...restParts] = companyName.split(' ');
    const companySub = restParts.join(' ') || 'Solutions Pvt Ltd';

    const gstNumber = process.env.COMPANY_GST || '36AAPCP4657A1ZA';
    const companyPhone = process.env.COMPANY_PHONE || '+919949537749';
    const companyEmail = process.env.COMPANY_EMAIL || 'info@pixelmindsolutions.com';
    const companyWebsite = process.env.COMPANY_WEBSITE || 'www.pixelmindsolutions.com';
    const companyLocation = process.env.COMPANY_LOCATION || 'Hyderabad';
    const directorName = process.env.COMPANY_DIRECTOR || 'K.Narasimha Varma';

    const logoSrc = await getLogoSrc();
    
    const logoHTML = logoSrc ? 
        `<div class="logo-box"><img src="${logoSrc}" alt="${companyName}"></div>` : 
        `<div class="logo-box" style="background:#ffffff; border-radius:50%; display:flex; align-items:center; justify-content:center;">
            <span style="font-size:22pt; font-weight:bold; color:#146356;">${companyFirst.substring(0,2).toUpperCase()}</span>
         </div>`;

    const dateStr = new Date(invoice.paymentDate || Date.now())
        .toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <style>
      @page { margin: 0; size: A4; }
      * { box-sizing: border-box; }
      body { margin:0; padding:0; font-family: 'Helvetica', Arial, sans-serif; color:#1e293b; background: #ffffff; }

      .sheet { 
        width: 210mm; 
        height: 297mm; 
        display: flex; 
        border: none;
        position: relative;
        background: #ffffff;
      }

      /* ============ SIDEBAR ============ */
      .sidebar {
        width: 55mm; 
        background: #146356; 
        color: #ffffff;
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        padding-top: 22mm;
        flex-shrink: 0;
      }

      .sidebar .logo-box {
        width: 40mm; 
        height: 40mm; 
        background: transparent;
        display: flex; 
        align-items: center; 
        justify-content: center; 
        overflow: visible;
        margin-bottom: 0;
      }
      .sidebar .logo-box img { 
        width: 100%; 
        height: 100%; 
        object-fit: contain; 
        display: block;
      }

      /* ============ MAIN CONTENT ============ */
      .main { 
        flex: 1; 
        display: flex; 
        flex-direction: column; 
        padding: 14mm 14mm 8mm 14mm;
        position: relative;
        background: #ffffff;
      }

      .header { display:flex; justify-content:flex-end; }
      .header .title-block { text-align: right; }
      .header .invoice-title { 
        font-size: 32pt; 
        font-weight: 800; 
        letter-spacing: 1.5pt; 
        color: #1a1a1a; 
      }
      .header .gst { 
        font-size: 10pt; 
        font-weight: bold; 
        color: #333333; 
        margin-top: 1mm; 
      }

      .invoice-to { margin-top: 10mm; }
      .invoice-to .label { 
        font-size: 10pt; 
        font-weight: bold; 
        color: #146356; 
        text-transform: uppercase;
        letter-spacing: 0.5pt;
      }
      .invoice-to .client-name { 
        font-size: 18pt; 
        font-weight: bold; 
        color: #1a1a1a; 
        margin-top: 1mm; 
      }

      .meta-row { 
        display: flex; 
        justify-content: space-between; 
        margin-top: 6mm; 
        font-size: 10pt; 
      }
      .meta-row .contact div { margin-bottom: 1.5mm; color: #333333; }
      .meta-row .field-label { font-weight: bold; color: #1a1a1a; }
      .meta-row .field-value { color: #333333; margin-top: 0.5mm; }

      table.items { 
        width: 100%; 
        border-collapse: collapse; 
        margin-top: 12mm; 
        font-size: 10.5pt; 
      }
      table.items thead tr { background: #146356; color: #ffffff; }
      table.items th { 
        padding: 3.5mm 4mm; 
        font-size: 9pt; 
        font-weight: bold; 
        letter-spacing: 0.5pt; 
        text-align: left; 
      }
      table.items th.center { text-align: center; }
      table.items th.right { text-align: right; }
      table.items td { 
        padding: 3.5mm 4mm; 
        border-bottom: 0.3pt solid #eef1f0; 
        color: #333333; 
        font-size: 10.5pt;
      }
      table.items td.item-name { font-weight: bold; color: #1a1a1a; }
      table.items td.center { text-align: center; }
      table.items td.right { text-align: right; font-weight: bold; color: #1a1a1a; }

      .totals { display: flex; justify-content: flex-end; margin-top: 2mm; }
      .totals table { 
        width: 70mm; 
        font-size: 10.5pt; 
        border-collapse: collapse; 
      }
      .totals td { padding: 2mm 3mm; }
      .totals td.label { font-weight: bold; color: #333333; }
      .totals td.value { text-align: right; color: #333333; }
      .totals tr.subtotal td { 
        border-top: 0.4pt solid #e2e8f0; 
        color: #146356; 
        font-weight: bold; 
      }

      .grand-row { 
        display: flex; 
        justify-content: space-between; 
        align-items: flex-end; 
        margin-top: 4mm;
        padding-top: 2mm;
        padding-bottom: 2mm;
      }
      .grand-row .total-label { 
        font-size: 11pt; 
        font-weight: bold; 
        color: #1a1a1a; 
      }
      .grand-row .total-value { 
        font-size: 28pt; 
        font-weight: 800; 
        color: #1a1a1a; 
        margin-top: 1mm; 
      }
      .grand-row .signature { text-align: right; }
      .grand-row .sign-name { 
        font-size: 12pt; 
        font-weight: bold; 
        color: #1a1a1a; 
      }
      .grand-row .director-badge {
        display: inline-block; 
        margin-top: 2mm; 
        background: #146356; 
        color: #ffffff;
        font-size: 9pt; 
        font-weight: bold; 
        letter-spacing: 0.5pt; 
        padding: 2.5mm 8mm; 
        border-radius: 5mm;
      }

      /* ============ FOOTER ============ */
      .footer {
        background: #ffffff; 
        color: #333333; 
        padding: 5mm 14mm 4mm 14mm;
        display: flex; 
        justify-content: space-between; 
        align-items: center;
        font-size: 9.5pt;
        width: 100%;
        position: absolute;
        bottom: 0;
        left: 0;
        border-top: 0.4pt solid #e2e8f0;
      }

      .footer .footer-left {
        display: flex;
        flex-direction: column;
        gap: 2mm;
      }

      .footer .footer-left .footer-item {
        display: flex;
        align-items: center;
        gap: 3mm;
        color: #333333;
      }

      .footer .footer-left .footer-item .icon-circle {
        width: 6.5mm;
        height: 6.5mm;
        background: #146356;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 8pt;
        font-weight: bold;
        flex-shrink: 0;
      }

      .footer .footer-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2mm;
      }

      .footer .footer-right .footer-item {
        display: flex;
        align-items: center;
        gap: 3mm;
        color: #333333;
      }

      .footer .footer-right .footer-item .icon-circle {
        width: 6.5mm;
        height: 6.5mm;
        background: #146356;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 8pt;
        font-weight: bold;
        flex-shrink: 0;
        order: 1;
      }

      .footer .footer-right .footer-item span {
        order: 0;
      }
    </style>
    </head>
    <body>
      <div class="sheet">
        <div class="sidebar">
          ${logoHTML}
        </div>

        <div class="main">
          <div class="header">
            <div class="title-block">
              <div class="invoice-title">INVOICE</div>
              <div class="gst">GST NUMBER : ${gstNumber}</div>
            </div>
          </div>

          <div class="invoice-to">
            <div class="label">Invoice To</div>
            <div class="client-name">${client.name || ''}</div>
          </div>

          <div class="meta-row">
            <div class="contact">
              <div>${client.mobile || client.phone || ''}</div>
              <div>${client.address || ''}</div>
            </div>
            <div>
              <div class="field-label">Invoice No:</div>
              <div class="field-value">${invoice.invoiceNumber || ''}</div>
            </div>
            <div>
              <div class="field-label">Date:</div>
              <div class="field-value">${dateStr}</div>
            </div>
          </div>

          <table class="items">
            <thead>
              <tr>
                <th>ITEM DESCRIPTION</th>
                <th class="center">UNIT PRICE</th>
                <th class="center">QUANTITY</th>
                <th class="right">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="item-name">${invoice.installmentTitle || ''}</td>
                <td class="center">${fmt(invoice.amount)}</td>
                <td class="center">01</td>
                <td class="right">${fmt(invoice.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr><td class="label">TOTAL</td><td class="value">${fmt(invoice.amount)}</td></tr>
              <tr><td class="label">GST (18%)</td><td class="value">${fmt(invoice.tax)}</td></tr>
              <tr class="subtotal"><td class="label">SUB TOTAL</td><td class="value">${fmt(invoice.totalAmount)}</td></tr>
            </table>
          </div>

          <div style="height: 3mm;"></div>

          <div class="grand-row">
            <div>
              <div class="total-label">TOTAL</div>
              <div class="total-value">${fmt(invoice.totalAmount)}</div>
            </div>
            <div class="signature">
              <div class="sign-name">${directorName}</div>
              <div class="director-badge">DIRECTOR</div>
            </div>
          </div>

          <!-- ============ FOOTER ============ -->
          <div class="footer">
            <div class="footer-left">
                <div class="footer-item">
                    <span class="icon-circle">📞</span>
                    <span>${companyPhone}</span>
                </div>
                <div class="footer-item">
                    <span class="icon-circle">✉️</span>
                    <span>${companyEmail}</span>
                </div>
            </div>
            <div class="footer-right">
                <div class="footer-item">
                    <span>${companyWebsite}</span>
                    <span class="icon-circle">🌐</span>
                </div>
                <div class="footer-item">
                    <span>${companyLocation}</span>
                    <span class="icon-circle">📍</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
}

// ============ PDF GENERATION ============
const generatePDFReceipt = async (invoice, project, client) => {
    const html = await buildInvoiceHTML({ invoice, project, client });

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        return pdfBuffer;
    } finally {
        await browser.close();
    }
};

module.exports = { generatePDFReceipt, buildInvoiceHTML };