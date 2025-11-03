'use client';

import { useEffect, useState } from 'react';
import { FileText, Download, Euro, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerEmail: string | null;
  customerName: string | null;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  dueDate: string | null;
  pdfUrl: string | null;
  hostedInvoiceUrl: string | null;
  createdAt: string;
}

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/invoices');
        if (res.ok) setInvoices(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-center py-8">Lade Rechnungen...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Rechnungen ({invoices.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 font-semibold text-foreground">Rechnung</th>
              <th className="text-left p-4 font-semibold text-foreground">Kunde</th>
              <th className="text-left p-4 font-semibold text-foreground">Betrag</th>
              <th className="text-left p-4 font-semibold text-foreground">Status</th>
              <th className="text-left p-4 font-semibold text-foreground">Datum</th>
              <th className="text-left p-4 font-semibold text-foreground">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b border-border hover:bg-card/50">
                <td className="p-4"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /><span className="font-mono text-sm">{inv.invoiceNumber}</span></div></td>
                <td className="p-4">
                  <div>{inv.customerName && <div className="font-medium text-foreground">{inv.customerName}</div>}</div>
                  <div className="text-sm text-muted-foreground">{inv.customerEmail || 'N/A'}</div>
                </td>
                <td className="p-4"><div className="flex items-center gap-2"><Euro className="w-4 h-4 text-primary" /><span className="font-semibold">{inv.amount.toFixed(2)} {inv.currency}</span></div></td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {inv.status === 'paid' ? (<><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-500">Bezahlt</span></>) : (<><XCircle className="w-4 h-4 text-red-500" /><span className="text-red-500">{inv.status}</span></>)}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('de-DE') : inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('de-DE') : new Date(inv.createdAt).toLocaleDateString('de-DE')}</span>
                  </div>
                </td>
                <td className="p-4">
                  {inv.pdfUrl && (
                    <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors text-sm">
                      <Download className="w-4 h-4" /> PDF
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



