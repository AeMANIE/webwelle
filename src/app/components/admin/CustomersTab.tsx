'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// SVG-Icons ohne externe Abhängigkeiten
const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const EuroIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4m9-1.5a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);


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


export default function CustomersTab() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Lade Kunden direkt
        const res = await fetch('/api/admin/customers');
        if (res.ok) {
          const data = await res.json();
          console.log('Kunden geladen:', data.length, data);
          setCustomers(data);
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error('Fehler beim Laden der Kunden:', res.status, errorData);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Kunden:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  if (loading) return <div className="text-center py-8">Lade Kunden...</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Alle Kunden ({customers.length})
        </h2>
        <p className="text-muted-foreground">Klicken Sie auf einen Kunden, um alle Details zu sehen</p>
        {customers.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-500 text-sm">
              ⚠️ Keine Kunden gefunden. Bitte prüfen Sie:
            </p>
            <ul className="text-yellow-500/80 text-sm mt-2 ml-4 list-disc">
              <li>Ob die customers Tabelle in der Datenbank existiert</li>
              <li>Ob die DATABASE_URL in .env.local korrekt ist</li>
              <li>Die Server-Logs für detaillierte Fehlermeldungen</li>
            </ul>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {customers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Keine Kunden gefunden.
          </div>
        ) : (
          customers.map((customer) => (
          <div 
            key={customer.id} 
            className="bg-card rounded-lg p-6 border border-border hover:border-brand/50 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-foreground">{customer.name || 'Kein Name'}</h3>
                  {customer.customerNumber && (
                    <span className="bg-brand/10 text-brand px-2 py-1 rounded text-xs font-mono">{customer.customerNumber}</span>
                  )}
                  {customer.portalActivated && (
                    <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs">Portal aktiviert</span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2"><MailIcon />{customer.email}</div>
                  {customer.phone && <div className="flex items-center gap-2"><PhoneIcon />{customer.phone}</div>}
                  {customer.companyName && <div className="flex items-center gap-2"><BuildingIcon />{customer.companyName}</div>}
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2"><UsersIcon /> <span>{customer.stats.bookingCount} Bestellungen</span></div>
                  <div className="flex items-center gap-2"><EuroIcon /> <span>{(customer.stats.totalRevenue / 100).toFixed(2)} €</span></div>
                  {customer.stats.lastBookingDate && (
                    <div className="flex items-center gap-2"><CalendarIcon /> <span>Letzte: {new Date(customer.stats.lastBookingDate).toLocaleDateString('de-DE')}</span></div>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  // Navigation zur Detail-Seite
                  window.location.href = `/admin/customers/${customer.id}`;
                }}
                className="ml-4 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors flex items-center gap-2"
              >
                <EyeIcon />
                Details anzeigen
              </button>
            </div>
          </div>
          ))
        )}
      </div>

    </div>
  );
}



