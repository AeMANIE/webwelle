import PDFDocument from 'pdfkit';

type LineItem = {
  description: string;
  quantity: number;
  netAmount: number; // EUR
  interval?: 'monthly' | 'yearly' | 'oneTime';
};

export function generateInvoicePdf(options: {
  invoiceNumber: string;
  issueDate: Date;
  customer: { name?: string | null; email?: string | null; address?: string | null };
  items: LineItem[];
  banking: {
    companyName: string;
    addressLine: string;
    iban: string;
    bic: string;
    taxOffice: string;
    taxNumber: string;
    vatId: string;
  };
  notes?: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (d) => chunks.push(d as Buffer));
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', (error) => {
      reject(error);
    });

  // Header Branding
  doc
    .fontSize(20)
    .fillColor('#0e141f')
    .text('AeManie GmbH', { continued: false });
  doc
    .moveDown(0.2)
    .fontSize(10)
    .fillColor('#555')
    .text(options.banking.addressLine)
    .moveDown(0.5)
    .strokeColor('#DCA441')
    .lineWidth(2)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke()
    .moveDown(0.8);

  // Invoice Info
  doc.fontSize(14).fillColor('#0e141f').text('Rechnung', { continued: false });
  doc.fontSize(10).fillColor('#000');
  doc.text(`Rechnungsnummer: ${options.invoiceNumber}`);
  doc.text(`Rechnungsdatum: ${formatDate(options.issueDate)}`);

  // Customer
  doc.moveDown(0.6).fontSize(12).text('Kunde');
  doc.fontSize(10).fillColor('#000');
  if (options.customer.name) doc.text(String(options.customer.name));
  if (options.customer.email) doc.text(String(options.customer.email));
  if (options.customer.address) doc.text(String(options.customer.address));

  // Items table
  doc.moveDown(1);
  const tableTop = doc.y;
  drawTableHeader(doc, tableTop);

  let y = tableTop + 18;
  let netTotal = 0;
  options.items.forEach((it) => {
    const lineNet = it.netAmount * it.quantity;
    netTotal += lineNet;
    drawRow(doc, y, [
      it.description,
      it.interval === 'monthly' ? 'monatlich' : it.interval === 'yearly' ? 'jährlich' : 'einmalig',
      String(it.quantity),
      euro(it.netAmount),
      euro(lineNet),
    ]);
    y += 18;
    if (y > 760) {
      doc.addPage();
      y = 50;
    }
  });

  const vat = round2(netTotal * 0.19);
  const gross = round2(netTotal + vat);

  // Totals
  doc.moveDown(1.2);
  doc.fontSize(10);
  doc.text(`Zwischensumme (Netto): ${euro(netTotal)}`);
  doc.text(`zzgl. 19% MwSt: ${euro(vat)}`);
  doc.fontSize(12).text(`Gesamtbetrag (Brutto): ${euro(gross)}`);

  // Banking + Legal
  doc.moveDown(1.2).fontSize(10).fillColor('#0e141f').text('Zahlungsinformationen');
  doc.fillColor('#000');
  doc.text(`IBAN: ${options.banking.iban}`);
  doc.text(`BIC: ${options.banking.bic}`);
  doc.text(`Finanzamt: ${options.banking.taxOffice}`);
  doc.text(`Steuer-Nr.: ${options.banking.taxNumber}`);
  doc.text(`USt.-ID: ${options.banking.vatId}`);

  if (options.notes) {
    doc.moveDown(0.8).fontSize(9).fillColor('#555').text(options.notes);
  }

  doc.end();
  });
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number) {
  doc.fontSize(10).fillColor('#0e141f');
  drawRow(doc, y, ['Beschreibung', 'Intervall', 'Menge', 'Preis (Netto)', 'Gesamt (Netto)']);
}

function drawRow(doc: PDFKit.PDFDocument, y: number, cols: string[]) {
  const [c1, c2, c3, c4, c5] = cols;
  doc.fillColor('#000');
  doc.text(c1, 50, y, { width: 230 });
  doc.text(c2, 290, y, { width: 70 });
  doc.text(c3, 360, y, { width: 40, align: 'right' });
  doc.text(c4, 405, y, { width: 70, align: 'right' });
  doc.text(c5, 480, y, { width: 70, align: 'right' });
}

function euro(v: number) {
  return `${v.toFixed(2)} €`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('de-DE');
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}


