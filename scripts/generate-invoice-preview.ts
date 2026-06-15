import { writeFileSync } from 'fs';
import path from 'path';
import { generateInvoicePdf } from '../src/lib/invoice-pdf';

const INVOICE_BANKING = {
  companyName: 'AeManie GmbH',
  addressLine: 'Uhlandstr. 16 – 87437 Kempten',
  bankName: 'Sparkasse Allgäu',
  iban: 'DE25 7335 0000 05163187 06',
  bic: 'BYLADEM1ALG',
  taxOffice: 'Finanzamt Kempten',
  taxNumber: '127 121 20418',
  vatId: 'DE 367002188',
} as const;

async function main() {
  const pdf = await generateInvoicePdf({
    invoiceNumber: 'WW-2026-DEMO0001',
    issueDate: new Date(),
    customerNumber: 'WW-00042',
    customer: {
      name: 'Max Mustermann',
      email: 'max@beispiel-firma.de',
      address: 'Musterstraße 12, 87437 Kempten',
    },
    items: [
      { description: 'StarterWelle Paket', quantity: 1, netAmount: 699, interval: 'oneTime' },
      { description: 'SEO Profi', quantity: 1, netAmount: 299, interval: 'oneTime' },
      { description: 'Branding & Logo', quantity: 1, netAmount: 199, interval: 'oneTime' },
      { description: 'Lieferzeit-Rabatt', quantity: 1, netAmount: -50, interval: 'oneTime' },
    ],
    banking: INVOICE_BANKING,
  });

  const outPath = path.join(process.cwd(), 'info', 'sample-rechnung.pdf');
  writeFileSync(outPath, pdf);
  console.log(`Beispiel-Rechnung erstellt: ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
