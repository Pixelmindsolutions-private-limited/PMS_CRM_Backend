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

// ============ BUILD MANUAL INVOICE HTML ============
// services/pdfService.js - Updated buildManualInvoiceHTML function

async function buildManualInvoiceHTML(invoice) {
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

    const dateStr = new Date(invoice.date || Date.now())
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
        margin-top: 10mm; 
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

      .totals { 
        display: flex; 
        justify-content: flex-end; 
        margin-top: 1mm; 
      }
      .totals table { 
        width: 70mm; 
        font-size: 10.5pt; 
        border-collapse: collapse; 
      }
      .totals td { padding: 1.5mm 3mm; }
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
        margin-top: 2mm;
        padding-top: 1mm;
        padding-bottom: 1mm;
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
        margin-top: 1.5mm; 
        background: #146356; 
        color: #ffffff;
        font-size: 9pt; 
        font-weight: bold; 
        letter-spacing: 0.5pt; 
        padding: 2.5mm 8mm; 
        border-radius: 5mm;
      }

      .footer {
        background: #ffffff; 
        color: #333333; 
        padding: 4mm 14mm 4mm 14mm;
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
        gap: 1.5mm;
      }

      .footer .footer-left .footer-item {
        display: flex;
        align-items: center;
        gap: 3mm;
        color: #333333;
      }

      .footer .footer-left .footer-item .icon-circle {
        width: 5.5mm;
        height: 5.5mm;
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
        gap: 1.5mm;
      }

      .footer .footer-right .footer-item {
        display: flex;
        align-items: center;
        gap: 3mm;
        color: #333333;
      }

      .footer .footer-right .footer-item .icon-circle {
        width: 5.5mm;
        height: 5.5mm;
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

      .content-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
      }

      .spacer {
        flex: 1;
      }
    </style>
    </head>
    <body>
      <div class="sheet">
        <div class="sidebar">
          ${logoHTML}
        </div>

        <div class="main">
          <div class="content-wrapper">
            <div class="header">
              <div class="title-block">
                <div class="invoice-title">INVOICE</div>
                <div class="gst">GST NUMBER : ${gstNumber}</div>
              </div>
            </div>

            <div class="invoice-to">
              <div class="label">Invoice To</div>
              <div class="client-name">${invoice.clientName}</div>
            </div>

            <div class="meta-row">
              <div class="contact">
                <div>${invoice.clientMobile}</div>
                <div>${invoice.clientAddress || ''}</div>
              </div>
              <div>
                <div class="field-label">Invoice No:</div>
                <div class="field-value">${invoice.invoiceNumber}</div>
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
                ${invoice.items.map(item => `
                  <tr>
                    <td class="item-name">${item.description}</td>
                    <td class="center">${fmt(item.price)}</td>
                    <td class="center">${item.quantity}</td>
                    <td class="right">${fmt(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <table>
                <tr><td class="label">TOTAL</td><td class="value">${fmt(invoice.subtotal)}</td></tr>
                <tr class="subtotal"><td class="label">SUB TOTAL</td><td class="value">${fmt(invoice.totalAmount)}</td></tr>
              </table>
            </div>

            <!-- GRAND ROW - Moved closer to footer with less spacing -->
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
          </div>

          <!-- FOOTER -->
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

// ============ GENERATE MANUAL INVOICE PDF ============
const generateManualInvoicePDF = async (invoice) => {
    const html = await buildManualInvoiceHTML(invoice);

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

// ============ EXPORTS ============
module.exports = {
    generateManualInvoicePDF,
    buildManualInvoiceHTML
};