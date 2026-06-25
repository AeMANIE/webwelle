import type { InvoiceData } from '@/lib/database';
import { getInvoiceByRef } from './resolve';

export async function assertCustomerOwnsInvoice(
  invoiceRef: string,
  customerId: string,
  email: string
): Promise<InvoiceData | null> {
  const invoice = await getInvoiceByRef(invoiceRef);
  if (!invoice) return null;

  const normalizedEmail = email.toLowerCase();
  const invoiceEmail = (invoice.customer_email || '').toLowerCase();

  if (invoice.customer_id && String(invoice.customer_id) === String(customerId)) {
    return invoice;
  }

  if (invoiceEmail && invoiceEmail === normalizedEmail) {
    return invoice;
  }

  return null;
}
