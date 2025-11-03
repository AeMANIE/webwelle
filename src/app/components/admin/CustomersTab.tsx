'use client';

import { useEffect, useState } from 'react';
import { Users, Mail, Phone, Building, Euro, Calendar, Eye } from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  companyName?: string;
  portalActivated: boolean;
  createdAt: string;
  stats: {
    bookingCount: number;
    totalRevenue: number;
    lastBookingDate?: string;
  };
}

export default function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

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
              <button className="ml-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Eye className="w-4 h-4" /> Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



