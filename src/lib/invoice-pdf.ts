import PDFDocument from 'pdfkit';
import path from 'path';
import { WW_COLORS } from '@/lib/design-tokens';

type LineItem = {
  description: string;
  quantity: number;
  netAmount: number; // EUR
  interval?: 'monthly' | 'yearly' | 'oneTime';
};

export type InvoiceBankingInfo = {
  companyName: string;
  addressLine: string;
  bankName: string;
  iban: string;
  bic: string;
  taxOffice: string;
  taxNumber: string;
  vatId: string;
};

const PAGE_LEFT = 50;
const PAGE_RIGHT = 545;
const PAGE_WIDTH = PAGE_RIGHT - PAGE_LEFT;
const RIGHT_COL_WIDTH = 220;
const ACCENT_COLOR = WW_COLORS.primary;
const LOGO_PATH = path.join(process.cwd(), 'public', 'logo250.png');
const LOGO_SIZE = 80;

export function generateInvoicePdf(options: {
  invoiceNumber: string;
  issueDate: Date;
  customerNumber?: string | null;
  customer: { name?: string | null; email?: string | null; address?: string | null };
  items: LineItem[];
  banking: InvoiceBankingInfo;
  notes?: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: PAGE_LEFT });
    const chunks: Buffer[] = [];
    doc.on('data', (d) => chunks.push(d as Buffer));
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', (error) => {
      reject(error);
    });

    const headerY = PAGE_LEFT;

    try {
      doc.image(LOGO_PATH, PAGE_LEFT, headerY, { width: LOGO_SIZE, height: LOGO_SIZE });
    } catch {
      // Logo optional – Rechnung bleibt ohne Bild nutzbar
    }

    const companyX = PAGE_RIGHT - RIGHT_COL_WIDTH;
    doc
      .fontSize(20)
      .fillColor('#0e141f')
      .text(options.banking.companyName, companyX, headerY, { width: RIGHT_COL_WIDTH, align: 'right' });
    doc
      .fontSize(10)
      .fillColor('#555')
      .text(options.banking.addressLine, companyX, headerY + 26, { width: RIGHT_COL_WIDTH, align: 'right' });

    const lineY = headerY + LOGO_SIZE + 14;
    doc
      .strokeColor(ACCENT_COLOR)
      .lineWidth(2)
      .moveTo(PAGE_LEFT, lineY)
      .lineTo(PAGE_RIGHT, lineY)
      .stroke();

    const metaY = lineY + 22;
    let leftY = metaY;
    doc.fontSize(12).fillColor('#0e141f').text('Kunde', PAGE_LEFT, leftY);
    leftY += 18;
    doc.fontSize(10).fillColor('#000');
    if (options.customer.name) {
      doc.text(String(options.customer.name), PAGE_LEFT, leftY, { width: 260 });
      leftY = doc.y + 2;
    }
    if (options.customer.email) {
      doc.text(String(options.customer.email), PAGE_LEFT, leftY, { width: 260 });
      leftY = doc.y + 2;
    }
    if (options.customer.address) {
      doc.text(String(options.customer.address), PAGE_LEFT, leftY, { width: 260 });
      leftY = doc.y + 2;
    }

    let rightY = metaY;
    const rightX = PAGE_RIGHT - RIGHT_COL_WIDTH;
    const addMetaLine = (label: string, value: string) => {
      doc.fontSize(10).fillColor('#555').text(label, rightX, rightY, { width: RIGHT_COL_WIDTH, align: 'right' });
      rightY += 14;
      doc.fontSize(10).fillColor('#000').text(value, rightX, rightY, { width: RIGHT_COL_WIDTH, align: 'right' });
      rightY += 20;
    };

    addMetaLine('Rechnungsnummer', options.invoiceNumber);
    addMetaLine('Rechnungsdatum', formatDate(options.issueDate));
    if (options.customerNumber) {
      addMetaLine('Kundennummer', options.customerNumber);
    }

    const sectionStartY = Math.max(leftY, rightY) + 16;
    doc.y = sectionStartY;

    const tableTop = sectionStartY;
    drawTableHeader(doc, tableTop);

    let y = tableTop + 20;
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
      y += 20;
      if (y > 700) {
        doc.addPage();
        y = PAGE_LEFT;
      }
    });

    const vat = round2(netTotal * 0.19);
    const gross = round2(netTotal + vat);
    const totalsX = PAGE_RIGHT - 220;
    const totalsY = y + 12;

    doc.fontSize(10).fillColor('#000');
    doc.text(`Zwischensumme (Netto): ${euro(netTotal)}`, totalsX, totalsY, { width: 220, align: 'right' });
    doc.text(`zzgl. 19% MwSt: ${euro(vat)}`, totalsX, totalsY + 16, { width: 220, align: 'right' });
    doc.fontSize(12).fillColor('#0e141f');
    doc.text(`Gesamtbetrag (Brutto): ${euro(gross)}`, totalsX, totalsY + 34, { width: 220, align: 'right' });

    const footerY = totalsY + 72;
    doc
      .strokeColor(ACCENT_COLOR)
      .lineWidth(1)
      .moveTo(PAGE_LEFT, footerY)
      .lineTo(PAGE_RIGHT, footerY)
      .stroke();

    let footerTextY = footerY + 14;
    doc.fontSize(9).fillColor('#333');
    const footerLines = [
      options.banking.bankName,
      `BIC: ${options.banking.bic}`,
      `IBAN: ${options.banking.iban}`,
      options.banking.taxOffice,
      `Steuer Nr.: ${options.banking.taxNumber}`,
      `USt.-ID: ${options.banking.vatId}`,
    ];
    footerLines.forEach((line) => {
      doc.text(line, PAGE_LEFT, footerTextY, { width: PAGE_WIDTH, align: 'center' });
      footerTextY += 13;
    });

    if (options.notes) {
      doc.moveDown(0.6).fontSize(9).fillColor('#555').text(options.notes, PAGE_LEFT, footerTextY + 6, {
        width: PAGE_WIDTH,
        align: 'center',
      });
    }

    doc.end();
  });
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number) {
  doc.fontSize(10).fillColor('#0e141f');
  drawRow(doc, y, ['Beschreibung', 'Intervall', 'Menge', 'Preis (Netto)', 'Gesamt (Netto)']);
  doc
    .strokeColor(ACCENT_COLOR)
    .lineWidth(0.5)
    .moveTo(PAGE_LEFT, y + 14)
    .lineTo(PAGE_RIGHT, y + 14)
    .stroke();
}

function drawRow(doc: PDFKit.PDFDocument, y: number, cols: string[]) {
  const [c1, c2, c3, c4, c5] = cols;
  doc.fillColor('#000').fontSize(9);
  doc.text(c1, PAGE_LEFT, y, { width: 230 });
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
