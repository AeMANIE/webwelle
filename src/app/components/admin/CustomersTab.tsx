'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, Phone, Building, Euro, Calendar, Eye, X, CheckCircle, XCircle } from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  companyName?: string;
  customerNumber?: string;
  portalActivated: boolean;
  createdAt: string;
  stats: {
    bookingCount: number;
    totalRevenue: number;
    lastBookingDate?: string;
  };
}

interface BookingRow {
  id: string;
  package_type: string;
  status: string;
  created_at: string;
}

interface InvoiceRow {
  id: string;
  number: string | null;
  amount: number;
  currency?: string;
  status: string;
  pdfUrl: string | null;
  createdAt: string;
}

interface SubscriptionRow {
  id: string;
  status: string;
  currentPeriodEnd?: string | null;
  canceledAt?: string | null;
  items?: Array<{ recurring?: string; amount: number; currency?: string }>;
}

interface CustomerDetailResponse {
  customer: { id: string; email: string; name?: string };
  bookings: BookingRow[];
  invoices: InvoiceRow[];
  subscriptions: SubscriptionRow[];
}

export default function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [details, setDetails] = useState<CustomerDetailResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/customers');
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = customers.filter(c =>
    (c.email || '').toLowerCase().includes(filter.toLowerCase()) || (c.name || '').toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div className="text-center py-8">Lade Kunden...</div>;

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Nach E-Mail oder Name suchen..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-background border border-border rounded-lg text-foreground"
        />
      </div>

      <div className="grid gap-4">
        {filtered.map((customer) => (
          <div key={customer.id} className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-foreground">{customer.name || 'Kein Name'}</h3>
                  {customer.customerNumber && (
                    <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-xs font-mono">{customer.customerNumber}</span>
                  )}
                  {customer.portalActivated && (
                    <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs">Portal aktiviert</span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4" />{customer.email}</div>
                  {customer.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{customer.phone}</div>}
                  {customer.companyName && <div className="flex items-center gap-2"><Building className="w-4 h-4" />{customer.companyName}</div>}
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span>{customer.stats.bookingCount} Bestellungen</span></div>
                  <div className="flex items-center gap-2"><Euro className="w-4 h-4 text-primary" /><span>{(customer.stats.totalRevenue / 100).toFixed(2)} €</span></div>
                  {customer.stats.lastBookingDate && (
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /><span>Letzte: {new Date(customer.stats.lastBookingDate).toLocaleDateString('de-DE')}</span></div>
                  )}
                </div>
              </div>
              <button
                className="ml-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                onClick={async () => {
                  setLoadingDetails(true);
                  setDetails(null);
                  try {
                    const res = await fetch(`/api/admin/customers/${customer.id}`);
                    if (res.ok) setDetails(await res.json() as CustomerDetailResponse);
                  } finally {
                    setLoadingDetails(false);
                  }
                }}
              >
                <Eye className="w-4 h-4" /> Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {details && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Kundendetails</h2>
              <button className="p-2 hover:bg-muted rounded" onClick={() => setDetails(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pakete/Buchungen */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Pakete (Buchungen)</h3>
              {details.bookings?.length ? (
                <div className="grid gap-3">
                  {details.bookings.map((b) => (
                    <div key={b.id} className="border border-border rounded p-3 text-sm">
                      <div className="flex justify-between">
                        <div className="font-medium text-foreground">{b.package_type}</div>
                        <div>
                          {b.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 text-green-500"><CheckCircle className="w-4 h-4" /> bezahlt</span>
                          ) : b.status === 'pending' ? (
                            <span className="text-yellow-500">ausstehend</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500"><XCircle className="w-4 h-4" /> {b.status}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-muted-foreground">{new Date(b.created_at).toLocaleString('de-DE')}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">Keine Buchungen</div>
              )}
            </div>

            {/* Abos */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Abonnements</h3>
            {details.subscriptions?.length ? (
                <div className="grid gap-3">
                  {details.subscriptions.map((s) => (
                    <div key={s.id} className="border border-border rounded p-3 text-sm">
                      <div className="flex justify-between">
                        <div className="font-medium text-foreground">{s.id}</div>
                        <div className={s.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}>{s.status}</div>
                      </div>
                      <div className="text-muted-foreground">Periode endet: {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString('de-DE') : '—'}</div>
                      {s.canceledAt && (
                        <div className="text-red-500">Gekündigt am: {new Date(s.canceledAt).toLocaleDateString('de-DE')}</div>
                      )}
                      {s.canceledAt && <div className="text-red-500">Gekündigt am: {new Date(s.canceledAt).toLocaleDateString('de-DE')}</div>}
                      <div className="mt-2">
                        {s.items?.map((i, idx) => (
                          <div key={idx} className="text-muted-foreground">{i.recurring} • {i.amount} {i.currency}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">Keine Abos</div>
              )}
            </div>

            {/* Rechnungen */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Rechnungen</h3>
              {details.invoices?.length ? (
                <div className="grid gap-3">
                  {details.invoices.map((inv) => (
                    <div key={inv.id} className="border border-border rounded p-3 text-sm flex justify-between items-center">
                      <div>
                        <div className="font-mono text-foreground">{inv.number}</div>
                        <div className="text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString('de-DE')}</div>
                      </div>
                      <div className="font-semibold">{inv.amount.toFixed(2)} {inv.currency}</div>
                      <div className={inv.status === 'paid' ? 'text-green-500' : 'text-red-500'}>{inv.status}</div>
                      <div>
                        {inv.pdfUrl && <a className="text-primary hover:underline" href={inv.pdfUrl} target="_blank">PDF</a>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">Keine Rechnungen</div>
              )}
            </div>

            {loadingDetails && <div className="mt-4 text-muted-foreground">Lade Details…</div>}
          </div>
        </div>
      )}
    </div>
  );
}



