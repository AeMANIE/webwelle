'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Download, Euro, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface Invoice {
  id: string;
  dbId?: string;
  invoiceNumber: string | null;
  customerEmail: string | null;
  customerName: string | null;
  customerNumber: string | null;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  dueDate: string | null;
  pdfUrl: string | null;
  hostedInvoiceUrl: string | null;
  createdAt: string;
  issuer?: string;
}

type TimePeriod = '30days' | '3months' | '6months' | 'all';

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<TimePeriod>('all');

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, statusFilter]);

  const loadInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        period: timeFilter,
        status: statusFilter,
      });
      const res = await fetch(`/api/admin/invoices?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setInvoices([]);
        setError(data.error || 'Rechnungen konnten nicht geladen werden');
        return;
      }
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      setInvoices([]);
      setError('Rechnungen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return invoices;
    return invoices.filter((inv) => inv.status === statusFilter);
  }, [invoices, statusFilter]);

  const exportCsv = () => {
    const headers = ['invoiceNumber', 'customerEmail', 'amount', 'currency', 'status', 'createdAt'];
    const rows = filtered.map((i) => [
      i.invoiceNumber ?? '',
      i.customerEmail ?? '',
      i.amount.toFixed(2),
      i.currency,
      i.status,
      i.createdAt,
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${statusFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pdfRef = (inv: Invoice) => encodeURIComponent(inv.dbId || inv.id);

  if (loading) return <div className="text-center py-8">Lade Rechnungen...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Rechnungen ({filtered.length})</h2>
        <div className="flex items-center gap-3">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimePeriod)}
            className="px-3 py-2 bg-background border border-border rounded text-foreground"
          >
            <option value="30days">Letzte 30 Tage</option>
            <option value="3months">Letzte 3 Monate</option>
            <option value="6months">Letzte 6 Monate</option>
            <option value="all">Alle</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded text-foreground"
          >
            <option value="all">Alle Status</option>
            <option value="paid">Bezahlt</option>
            <option value="open">Offen</option>
            <option value="void">Ungültig</option>
            <option value="uncollectible">Uneinbringlich</option>
          </select>
          <button
            onClick={exportCsv}
            className="px-3 py-2 bg-brand text-brand-foreground rounded hover:bg-brand/90"
          >
            CSV Export
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Keine Rechnungen für den gewählten Zeitraum gefunden.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-semibold text-foreground">Rechnung</th>
                <th className="text-left p-4 font-semibold text-foreground">Kunde</th>
                <th className="text-left p-4 font-semibold text-foreground">Betrag</th>
                <th className="text-left p-4 font-semibold text-foreground">Status</th>
                <th className="text-left p-4 font-semibold text-foreground">Datum</th>
                <th className="text-left p-4 font-semibold text-foreground">Issuer</th>
                <th className="text-left p-4 font-semibold text-foreground">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.dbId || inv.id} className="border-b border-border hover:bg-card/50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-mono text-sm">{inv.invoiceNumber || inv.id}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      {inv.customerName && (
                        <div className="font-medium text-foreground">{inv.customerName}</div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {inv.customerEmail || 'N/A'}
                      </div>
                      {inv.customerNumber && (
                        <div className="text-xs text-muted-foreground">Kd.-Nr. {inv.customerNumber}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-primary" />
                      <span className="font-semibold">
                        {inv.amount.toFixed(2)} {inv.currency}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {inv.status === 'paid' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-500">Bezahlt</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-500">{inv.status}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {inv.paidAt
                          ? new Date(inv.paidAt).toLocaleDateString('de-DE')
                          : inv.dueDate
                            ? new Date(inv.dueDate).toLocaleDateString('de-DE')
                            : new Date(inv.createdAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">{inv.issuer || 'WebWelle'}</span>
                  </td>
                  <td className="p-4">
                    <a
                      href={`/api/admin/invoices/pdf?id=${pdfRef(inv)}`}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-brand text-brand-foreground rounded hover:bg-brand/90 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" /> PDF
                    </a>
                    {inv.pdfUrl && (
                      <a
                        href={inv.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1 border border-primary text-primary rounded hover:bg-primary/10 transition-colors text-sm ml-2"
                      >
                        Stripe PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
