// services/pdfService.js
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Invoice = require("../models/Invoice");

// ============ LOGO LOADER ============
async function getLogoSrc() {
  const candidatePaths = [
    path.join(__dirname, "../uploads/image (18).png"),
    path.join(__dirname, "../uploads/image (18).png"),
    path.join(__dirname, "../uploads", "image (18).png"),
    path.join(process.cwd(), "uploads/image (18).png"),
    process.env.COMPANY_LOGO_PATH || "",
  ].filter(Boolean);

  const logoPath = candidatePaths.find((p) => fs.existsSync(p));

  if (logoPath) {
    try {
      const logoBase64 = fs.readFileSync(logoPath).toString("base64");
      const ext = (
        path.extname(logoPath).replace(".", "") || "png"
      ).toLowerCase();
      const mime = ext === "jpg" ? "jpeg" : ext;
      console.log(`✅ Logo loaded from: ${logoPath}`);
      return `data:image/${mime};base64,${logoBase64}`;
    } catch (err) {
      console.error(`⚠️ Logo file found but failed to read:`, err.message);
      return null;
    }
  }

  console.warn("⚠️ No logo found. Using text fallback.");
  return null;
}

// ============ BUILD MANUAL INVOICE HTML ============
// services/pdfService.js - Updated buildManualInvoiceHTML function

async function buildManualInvoiceHTML(invoice) {
  const companyName = process.env.COMPANY_NAME || "Pixelmind Solutions Pvt Ltd";

  const [companyFirst, ...restParts] = companyName.split(" ");
  const companySub = restParts.join(" ") || "Solutions Pvt Ltd";

  const gstNumber = process.env.COMPANY_GST || "36AAPCP4657A1ZA";
  const companyPhone = process.env.COMPANY_PHONE || "+919052097475";
  const companyPan = process.env.COMPANY_PAN || "";
  const companyEmail =
    process.env.COMPANY_EMAIL || "info@pixelmindsolutions.com";
  const companyWebsite =
    process.env.COMPANY_WEBSITE || "www.pixelmindsolutions.com";
  const companyLocation = process.env.COMPANY_LOCATION || "1st Floor, Siri Residency, KPHB 5th Phase, Hyderabad, Telangana 500085;"
  const directorName = process.env.COMPANY_DIRECTOR || "K.Narasimha Varma";

  const logoSrc = await getLogoSrc();

  // Safely read populated or directly supplied data
  const project = invoice.project || {};

  const client =
    invoice.client ||
    (invoice.clientId && typeof invoice.clientId === "object"
      ? invoice.clientId
      : {});

  const installment =
    invoice.installment ||
    (invoice.installmentId && typeof invoice.installmentId === "object"
      ? invoice.installmentId
      : {});

  // Escape dynamic text before inserting it into HTML
  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const fmt = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const clientName =
    invoice.clientName || client.name || project.clientName || "Client Name";

  const clientMobile =
    invoice.clientMobile || client.mobile || project.mobileNumber || "";

  const clientEmail =
    invoice.clientEmail || client.email || project.mailId || "";

  const clientAddress = invoice.clientAddress || client.address || "";

  const projectName = invoice.projectName || project.projectName || "Project";

  const projectCode = invoice.projectCode || project.projectId || "";

  const projectCost = Number(invoice.projectCost ?? project.projectCost ?? 0);

  const totalPaid = Number(invoice.totalPaid ?? project.totalPaid ?? 0);

  const remainingCost = Number(
    invoice.remainingCost ??
      project.remainingAmount ??
      Math.max(projectCost - totalPaid, 0),
  );

  const installmentTitle =
    invoice.installmentTitle || installment.title || "Project Installment";

  // SAC Code
  const sacCode = invoice.sacCode || installment.sacCode || "";
  const installmentAmount = Number(
    invoice.installmentAmount ?? invoice.amount ?? installment.value ?? 0,
  );

  const lineItems =
    Array.isArray(invoice.items) && invoice.items.length
      ? invoice.items
      : [
          {
            description: installmentTitle,
            price: installmentAmount,
            quantity: 1,
            total: installmentAmount,
            sacCode,
          },
        ];

  const gstAmount = Number(invoice.gstAmount ?? installment.gstAmount ?? 0);

  const sgstAmount = Number(invoice.sgstAmount ?? installment.sgstAmount ?? 0);

  const gstPercent = Number(invoice.gstPercent ?? installment.gstPercent ?? 0);

  const sgstPercent = Number(
    invoice.sgstPercent ?? installment.sgstPercent ?? 0,
  );

  const totalTax = Number(invoice.tax ?? gstAmount + sgstAmount);

  const subtotal = Number(invoice.subtotal ?? installmentAmount);

  const totalAmount = Number(invoice.totalAmount ?? subtotal + totalTax);

  const notes = invoice.notes || installment.notes || "";

  const invoiceNumber = invoice.invoiceNumber || "";

  const invoiceDate = new Date(invoice.date || invoice.createdAt || Date.now());

  const dateStr = Number.isNaN(invoiceDate.getTime())
    ? ""
    : invoiceDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  const dueDateStr = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const logoHTML = logoSrc
    ? `<div class="logo-box">
         <img src="${esc(logoSrc)}" alt="${esc(companyName)}">
       </div>`
    : `<div class="logo-box logo-fallback">
         <span>${esc(companyFirst.substring(0, 2).toUpperCase())}</span>
       </div>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${esc(invoiceNumber)}</title>

  <style>
    @page { margin: 0; }

    * { box-sizing: border-box; }

    html, body {
      width: 210mm;
      margin: 0;
      padding: 0;
    }

    body {
      font: 8.5pt/1.25 Arial, Helvetica, sans-serif;
      color: #1e293b;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .sheet {
      display: flex;
      position: relative;
      width: 210mm;
      background: #fff;
      overflow: visible;
    }

    .sidebar {
      flex: 0 0 29mm;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 10mm 2mm 0;
      color: #fff;
      background: #146356;
    }

    .logo-box {
      width: 23mm;
      height: 23mm;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .logo-box img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .logo-fallback {
      border-radius: 50%;
      background: #fff;
      color: #146356;
      font-size: 18pt;
      font-weight: 700;
    }

    .main {
      flex: 1 1 auto;
      min-width: 0;
      padding: 8mm 9mm 3mm;
      position: relative;
    }

    .header {
      display: flex;
      justify-content: flex-end;
      margin: 0 0 4mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .title-block { text-align: right; }

    .invoice-title {
      color: #1a1a1a;
      font-size: 23pt;
      line-height: 1;
      font-weight: 800;
      letter-spacing: 1pt;
    }

    .company-name {
      margin-top: 1.5mm;
      font-size: 10pt;
      font-weight: 700;
    }

    .gst-number {
      margin-top: 1mm;
      font-size: 8pt;
      font-weight: 700;
    }

    .section-title {
      margin-bottom: 1mm;
      color: #146356;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .35pt;
    }

    .client-name {
      color: #1a1a1a;
      font-size: 13pt;
      line-height: 1.15;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .client-contact {
      margin-top: 1mm;
      color: #444;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }

    .client-contact > div { margin: 0; }

    .meta-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 3mm;
      margin-top: 3mm;
      line-height: 1.3;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .meta-block {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .field-label {
      color: #1a1a1a;
      font-weight: 700;
    }

    .field-value { color: #333; }

    .project-details {
      margin-top: 4mm;
      padding: 2.5mm 3mm;
      background: #f5f8f7;
      border-left: 2px solid #146356;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .project-heading {
      margin-bottom: 1.5mm;
      color: #146356;
      font-size: 9pt;
      font-weight: 700;
    }

    .project-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1.5mm 3mm;
    }

    .project-item {
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    .project-item strong { color: #333; }

    table.items {
      width: 100%;
      margin-top: 4mm;
      border-collapse: collapse;
      table-layout: fixed;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    table.items thead { display: table-header-group; }

    table.items tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    table.items thead tr {
      color: #fff;
      background: #146356;
    }

    table.items th {
      padding: 1.6mm 1.2mm;
      font-size: 7.2pt;
      text-align: left;
      overflow-wrap: anywhere;
    }

    table.items td {
      padding: 1.8mm 1.2mm;
      border-bottom: .3pt solid #e5e7eb;
      font-size: 7.8pt;
      overflow-wrap: anywhere;
    }

    /* Five columns including SAC Code */
    table.items th:nth-child(1) { width: 34%; }
    table.items th:nth-child(2) { width: 16%; }
    table.items th:nth-child(3) { width: 21%; }
    table.items th:nth-child(4) { width: 10%; }
    table.items th:nth-child(5) { width: 19%; }

    .item-name {
      color: #1a1a1a;
      font-weight: 700;
    }

    .center { text-align: center !important; }
    .right { text-align: right !important; }

    .totals {
      display: flex;
      justify-content: flex-end;
      margin-top: 2mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .totals table {
      width: 75mm;
      border-collapse: collapse;
      font-size: 8pt;
    }

    .totals td { padding: 1mm 2mm; }

    .totals .label {
      color: #333;
      font-weight: 700;
    }

    .totals .value {
      text-align: right;
      white-space: nowrap;
    }

    .totals .grand-total td {
      border-top: 1px solid #146356;
      color: #146356;
      font-size: 9.5pt;
      font-weight: 700;
    }

    .notes {
      margin-top: 2.5mm;
      padding: 2mm 2.5mm;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      line-height: 1.3;
      overflow-wrap: anywhere;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .payment-status {
      margin-top: 2.5mm;
      color: #146356;
      font-weight: 700;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .signature-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 4mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .signature {
      min-width: 45mm;
      text-align: center;
    }

    .sign-name {
      color: #1a1a1a;
      font-size: 10pt;
      font-weight: 700;
    }

    .director-badge {
      display: inline-block;
      margin-top: 1mm;
      padding: 1mm 5mm;
      color: #fff;
      background: #146356;
      border-radius: 5mm;
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: .3pt;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      gap: 3mm;
      margin-top: 4mm;
      padding-top: 2mm;
      border-top: 1px solid #e2e8f0;
      color: #444;
      font-size: 7.2pt;
      line-height: 1.35;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .footer div {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    @media print {
      html, body { width: 210mm; }
      .sheet { width: 210mm; }
      header, section, table, footer, .signature-row {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }

</style>
</head>

<body>
  <div class="sheet">

    <aside class="sidebar">
      ${logoHTML}
    </aside>

    <main class="main">

      <header class="header">
        <div class="title-block">
          <div class="invoice-title">INVOICE</div>
          <div class="company-name">${esc(companyName)}</div>
          <div class="gst-number">
            GST NUMBER: ${esc(gstNumber)}
          </div>
        </div>
      </header>

      <section>
        <div class="section-title">Invoice To</div>
        <div class="client-name">${esc(clientName)}</div>

        <div class="client-contact">
          ${clientMobile ? `<div>Mobile: ${esc(clientMobile)}</div>` : ""}
          ${clientEmail ? `<div>Email: ${esc(clientEmail)}</div>` : ""}
          ${clientAddress ? `<div>Address: ${esc(clientAddress)}</div>` : ""}
        </div>
      </section>

      <section class="meta-row">
        <div class="meta-block">
          <div class="field-label">Project Code</div>
          <div class="field-value">${esc(projectCode || "N/A")}</div>
        </div>

        <div class="meta-block">
          <div class="field-label">Invoice No.</div>
          <div class="field-value">${esc(invoiceNumber || "N/A")}</div>
        </div>

        <div class="meta-block">
          <div class="field-label">Invoice Date</div>
          <div class="field-value">${esc(dateStr)}</div>

          ${
            dueDateStr
              ? `<div style="margin-top:2mm">
                   <span class="field-label">Due Date:</span>
                   ${esc(dueDateStr)}
                 </div>`
              : ""
          }
        </div>
      </section>

      <section class="project-details">
        <div class="project-heading">Project Details</div>

        <div class="project-grid">
          <div class="project-item">
            <strong>Project Name:</strong><br>
            ${esc(projectName)}
          </div>

          <div class="project-item">
            <strong>Project Code:</strong><br>
            ${esc(projectCode || "N/A")}
          </div>

          <div class="project-item">
            <strong>Total Project Cost:</strong><br>
            ${fmt(projectCost)}
          </div>

          <div class="project-item">
            <strong>Total Paid:</strong><br>
            ${fmt(totalPaid)}
          </div>

          <div class="project-item">
            <strong>Remaining Project Cost:</strong><br>
            ${fmt(remainingCost)}
          </div>

          <div class="project-item">
            <strong>This Installment:</strong><br>
            ${fmt(installmentAmount)}
          </div>
        </div>
      </section>

      <table class="items">
        <thead>
          <tr>
            <th>ITEM DESCRIPTION</th>
            <th class="right">UNIT PRICE</th>
            <th class="center">SAC CODE</th>
            <th class="center">QTY</th>
            <th class="right">AMOUNT</th>
          </tr>
        </thead>

        <tbody>
          ${lineItems
            .map((item) => {
              const quantity = Number(item.quantity || 1);
              const price = Number(item.price ?? item.total ?? 0);
              const amount = Number(item.total ?? price * quantity);
              const itemSacCode = item.sacCode || sacCode || "N/A";

              return `<tr>
                <td class="item-name">${esc(item.description || installmentTitle)}</td>
                <td class="right">${fmt(price)}</td>
                <td class="center">${esc(itemSacCode)}</td>
                <td class="center">${esc(quantity)}</td>
                <td class="right">${fmt(amount)}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>

      <section class="totals">
        <table>
          <tr>
            <td class="label">Subtotal</td>
            <td class="value">${fmt(subtotal)}</td>
          </tr>

          <tr>
            <td class="label">GST (${gstPercent}%)</td>
            <td class="value">${fmt(gstAmount)}</td>
          </tr>

          <tr>
            <td class="label">SGST (${sgstPercent}%)</td>
            <td class="value">${fmt(sgstAmount)}</td>
          </tr>

          ${
            totalTax !== gstAmount + sgstAmount
              ? `<tr>
                   <td class="label">Other Tax</td>
                   <td class="value">${fmt(
                     totalTax - gstAmount - sgstAmount,
                   )}</td>
                 </tr>`
              : ""
          }

          <tr class="grand-total">
            <td>Total Invoice Amount</td>
            <td class="value">${fmt(totalAmount)}</td>
          </tr>
        </table>
      </section>

      ${
        notes
          ? `<section class="notes">
               <strong>Notes:</strong><br>
               ${esc(notes).replace(/\n/g, "<br>")}
             </section>`
          : ""
      }

      <div class="payment-status">
        Payment Status: ${esc(invoice.status || "generated").toUpperCase()}
      </div>

      <section class="signature-row">
        <div class="signature">
          <div class="sign-name">${esc(directorName)}</div>
          <div class="director-badge">DIRECTOR</div>
        </div>
      </section>

      <footer class="footer">
        <div>
          <div><strong>Company:</strong> ${esc(companyName)}</div>
          <div><strong>Phone:</strong> ${esc(companyPhone)}</div>
          <div><strong>Email:</strong> ${esc(companyEmail)}</div>
          <div><strong>Office Address:</strong> ${esc(companyLocation)}</div>
        </div>

        <div style="text-align:right">
          <div><strong>Website:</strong> ${esc(companyWebsite)}</div>
          ${companyPan ? `<div><strong>PAN:</strong> ${esc(companyPan)}</div>` : ""}
          <div><strong>GSTIN:</strong> ${esc(gstNumber)}</div>
          <div><strong>Authorized Person:</strong> ${esc(directorName)}</div>
          <div><strong>Designation:</strong> Director</div>
        </div>
      </footer>

    </main>
  </div>
</body>
</html>
`;
}

const generateManualInvoicePDF = async (invoice) => {
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  let completeInvoice =
    typeof invoice.toObject === "function" ? invoice.toObject() : invoice;

  // Project invoices store client and project information by reference.
  if (invoice.projectId) {
    const populatedInvoice = await Invoice.findById(invoice._id || invoice.id)
      .populate("projectId")
      .populate("clientId");

    if (!populatedInvoice) {
      throw new Error("Invoice not found in database");
    }

    const invoiceData = populatedInvoice.toObject();
    const project = invoiceData.projectId;
    const client = invoiceData.clientId;

    if (!project || !client) {
      throw new Error("Project or client details not found for this invoice");
    }

    const installment = Array.isArray(project.installments)
      ? project.installments.find(
          (item) => String(item._id) === String(invoiceData.installmentId),
        )
      : null;

    completeInvoice = {
      ...invoiceData,
      project,
      projectName: project.projectName || "",
      projectCode: project.projectId || "",
      projectCost: Number(project.projectCost || 0),
      totalPaid: Number(project.totalPaid || 0),
      remainingCost: Number(
        project.remainingAmount ??
          Math.max(
            Number(project.projectCost || 0) - Number(project.totalPaid || 0),
            0,
          ),
      ),
      client,
      clientName: client.name || project.clientName || "",
      clientMobile: client.mobile || project.mobileNumber || "",
      clientEmail: client.email || project.mailId || "",
      clientAddress: client.address || "",
      installment: installment || {},
      installmentTitle:
        invoiceData.installmentTitle ||
        installment?.title ||
        "Project Installment",
      installmentAmount: Number(invoiceData.amount || 0),
      gstAmount: Number(installment?.gstAmount || 0),
      sgstAmount: Number(installment?.sgstAmount || 0),
      subtotal: Number(invoiceData.amount || 0),
      notes: installment?.notes || "",
    };
  }

  const html = await buildManualInvoiceHTML(completeInvoice);

  // 5. Locate system Chrome if available
  const chromePaths = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];

  let executablePath = null;

  for (const path of chromePaths) {
    if (fs.existsSync(path)) {
      executablePath = path;
      console.log(`Found Chrome at: ${executablePath}`);
      break;
    }
  }

  // 6. Launch Puppeteer
  const launchOptions = {
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--disable-software-rasterizer",
    ],
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();

    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);

    // Match the PDF page height to the complete rendered invoice.
    const contentHeightMm = await page.evaluate(() => {
      const sheet = document.querySelector(".sheet");
      const heightPx = sheet.getBoundingClientRect().height;
      return Math.ceil((heightPx * 25.4 / 96 + 0.5) * 10) / 10;
    });

    const pdfBuffer = await page.pdf({
      width: "210mm",
      height: `${contentHeightMm}mm`,
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
};

// ============ EXPORTS ============
module.exports = {
  generateManualInvoicePDF,
  buildManualInvoiceHTML,
};
