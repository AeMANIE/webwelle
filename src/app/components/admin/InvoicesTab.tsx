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
  issuer?: string;
}

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('6months');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case '1month':
        start.setMonth(end.getMonth() - 1);
        break;
      case '3months':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6months':
        start.setMonth(end.getMonth() - 6);
        break;
      case '1year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'custom':
        return {
          start: customStartDate || null,
          end: customEndDate || null,
        };
      default:
        start.setMonth(end.getMonth() - 6);
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const dateRangeObj = getDateRange();
        const params = new URLSearchParams();
        
        if (dateRangeObj.start) params.append('startDate', dateRangeObj.start);
        if (dateRangeObj.end) params.append('endDate', dateRangeObj.end);
        if (statusFilter !== 'all') params.append('status', statusFilter);

        const res = await fetch(`/api/admin/invoices?${params.toString()}`);
        if (res.ok) setInvoices(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, [statusFilter, dateRange, customStartDate, customEndDate]);

  if (loading) return <div className="text-center py-8">Lade Rechnungen...</div>;

  const filtered = invoices;

  const exportCsv = () => {
    const headers = ['invoiceNumber','customerEmail','amount','currency','status','createdAt'];
    const rows = filtered.map(i => [i.invoiceNumber, i.customerEmail ?? '', i.amount.toFixed(2), i.currency, i.status, i.createdAt]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `invoices-${statusFilter}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Rechnungen ({filtered.length})</h2>
        <p className="text-muted-foreground">Alle Rechnungen mit Filtern</p>
      </div>

      {/* Filter */}
      <div className="bg-card p-4 rounded-lg border border-border mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Zeitraum-Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Zeitraum</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded"
            >
              <option value="1month">Letzte 1 Monat</option>
              <option value="3months">Letzte 3 Monate</option>
              <option value="6months">Letzte 6 Monate</option>
              <option value="1year">Letztes Jahr</option>
              <option value="custom">Benutzerdefiniert</option>
            </select>
          </div>

          {/* Benutzerdefinierte Daten */}
          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Von</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Bis</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded"
                />
              </div>
            </>
          )}

          {/* Status-Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded"
            >
              <option value="all">Alle</option>
              <option value="paid">Bezahlt</option>
              <option value="open">Offen</option>
              <option value="void">Ungültig</option>
              <option value="uncollectible">Uneinbringlich</option>
            </select>
          </div>

          {/* Export-Button */}
          <div className="flex items-end">
            <button
              onClick={exportCsv}
              className="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              CSV Export
            </button>
          </div>
        </div>
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
              <th className="text-left p-4 font-semibold text-foreground">Issuer</th>
              <th className="text-left p-4 font-semibold text-foreground">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => (
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
                  <span className="text-sm text-muted-foreground">{inv.issuer || 'Stripe'}</span>
                </td>
                <td className="p-4">
                  {inv.pdfUrl && (
                    <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors text-sm">
                      <Download className="w-4 h-4" /> PDF
                    </a>
                  )}
                  <a
                    href={`/api/admin/invoices/pdf?id=${inv.id}`}
                    className="inline-flex items-center gap-2 px-3 py-1 border border-primary text-primary rounded hover:bg-primary/10 transition-colors text-sm ml-2"
                  >
                    <Download className="w-4 h-4" /> Branded PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



