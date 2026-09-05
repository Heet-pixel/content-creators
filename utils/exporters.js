const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

async function buildExcel(enquiries) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Content Crafters';
  const sheet = wb.addWorksheet('Enquiries');

  sheet.columns = [
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Full Name', key: 'fullName', width: 22 },
    { header: 'Business Name', key: 'businessName', width: 24 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Service', key: 'service', width: 20 },
    { header: 'Description', key: 'description', width: 44 },
    { header: 'Status', key: 'status', width: 14 }
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9AE32' } };

  enquiries.forEach((e) => {
    sheet.addRow({
      date: new Date(e.createdAt).toLocaleString(),
      fullName: e.fullName,
      businessName: e.businessName,
      phone: e.phone,
      email: e.email,
      category: e.category,
      service: e.service,
      description: e.description,
      status: e.status
    });
  });

  return wb.xlsx.writeBuffer();
}

function buildPDF(enquiries) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).fillColor('#2A3134').text('Content Crafters — Enquiries', { align: 'left' });
    doc.moveDown(0.2);
    doc.fontSize(9).fillColor('#888').text('Exported ' + new Date().toLocaleString());
    doc.moveDown(0.8);

    enquiries.forEach((e, i) => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(12).fillColor('#000').text(`${i + 1}. ${e.fullName} — ${e.businessName}`);
      doc.fontSize(9).fillColor('#333');
      doc.text(`Phone: ${e.phone}    Email: ${e.email}`);
      doc.text(`Category: ${e.category}    Service: ${e.service}    Status: ${e.status}`);
      doc.text(`Submitted: ${new Date(e.createdAt).toLocaleString()}`);
      doc.text(`Message: ${e.description}`);
      doc.moveDown(0.5);
      doc.strokeColor('#dddddd').moveTo(doc.x, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);
    });

    doc.end();
  });
}

module.exports = { buildExcel, buildPDF };
