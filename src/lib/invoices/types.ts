import type { InvoiceData } from '@/lib/database';

export type { InvoiceData };

export interface AdminInvoiceRow {
  id: string;
  stripeInvoiceId: string;
  invoiceNumber: string | null;
  customerEmail: string;
  customerName: string | null;
  customerNumber: string | null;
  amount: number;
  currency: string;
  status: string;
  issuer: string;
  paidAt: string | null;
  dueDate: string | null;
  pdfUrl: string | null;
  hostedInvoiceUrl: string | null;
  createdAt: string;
  bookingId: string | null;
}

export interface BookingLinkFields {
  booking_id?: string | null;
  session_id?: string | null;
  customer_id?: string | null;
  stripe_subscription_id?: string | null;
}
