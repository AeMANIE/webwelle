'use client';

import { useEffect, useState } from 'react';
import { Package, Calendar, Euro, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Booking {
  id: string;
  session_id: string;
  package_type: string;
  is_monthly: boolean;
  checkout_mode: string;
  total_amount_cents: number;
  currency: string;
  status: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  company_name?: string;
  created_at: string;
}

type TimePeriod = '3months' | '6months' | 'all';

export default function BookingsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimePeriod>('3months'); // Standard: letzte 3 Monate

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?period=${timeFilter}`);
      
      // Prüfe ob Response leer ist
      const text = await res.text();
      if (!text || text.trim() === '') {
        console.error('❌ Leere Response von API');
        setBookings([]);
        return;
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Fehler beim Parsen der Response:', parseError);
        console.error('Response Text:', text.substring(0, 200));
        setBookings([]);
        return;
      }
      
      if (res.ok) {
        // Prüfe ob data ein Array ist
        if (Array.isArray(data)) {
          setBookings(data);
        } else if (data && typeof data === 'object') {
          // Falls data ein Objekt ist, prüfe ob es ein Array enthält
          if (Array.isArray(data.bookings)) {
            setBookings(data.bookings);
          } else {
            console.warn('⚠️ Response ist kein Array:', data);
            setBookings([]);
          }
        } else {
          console.warn('⚠️ Unerwartetes Response-Format:', typeof data);
          setBookings([]);
        }
      } else {
        console.error('❌ API-Fehler:', res.status, res.statusText);
        console.error('Fehler beim Laden der Bestellungen:', data);
        // Zeige Fehlermeldung in der Konsole
        if (data && data.error) {
          console.error('API-Fehler:', data.error);
          if (data.message) {
            console.error('Fehlermeldung:', data.message);
          }
          if (data.solution) {
            console.error('Lösung:', data.solution);
          }
          if (data.details) {
            console.error('Details:', data.details);
          }
        }
        // Setze leeres Array bei Fehler
        setBookings([]);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Bestellungen:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Lade Bestellungen...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-green-500">
            <CheckCircle className="w-4 h-4" />
            Bezahlt
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-yellow-500">
            <Clock className="w-4 h-4" />
            Ausstehend
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-red-500">
            <XCircle className="w-4 h-4" />
            {status === 'failed' ? 'Fehlgeschlagen' : 'Storniert'}
          </span>
        );
      default:
        return <span className="text-muted-foreground">{status}</span>;
    }
  };

  const getPackageName = (packageType: string) => {
    const names: Record<string, string> = {
      starterwelle: 'StarterWelle',
      businesswelle: 'BusinessWelle',
      erfolgswelle: 'ErfolgsWelle',
      flowwelle: 'FlowWelle',
      powerwelle: 'PowerWelle',
      meisterwelle: 'MeisterWelle',
      minijob: 'Mini Job AI-Assistent',
      midijob: 'Midi Job AI-Assistenz',
      festangestellt: 'Festangestellt AI-Agent',
      einrichtungspaket: 'Einrichtungspaket AI Voice',
    };
    return names[packageType] || packageType;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Bestellungen ({bookings.length})
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Standard: Letzte 3 Monate
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimePeriod)}
            className="px-3 py-2 bg-background border border-border rounded-lg text-foreground"
          >
            <option value="3months">Letzte 3 Monate</option>
            <option value="6months">Letzte 6 Monate</option>
            <option value="all">Alle</option>
          </select>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Keine Bestellungen im gewählten Zeitraum gefunden.
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-card rounded-lg p-6 border border-border hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">
                      {getPackageName(booking.package_type)}
                    </h3>
                    {booking.is_monthly && (
                      <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-xs">
                        Monatlich
                      </span>
                    )}
                    {booking.checkout_mode === 'subscription' && (
                      <span className="bg-purple-500/10 text-purple-500 px-2 py-1 rounded text-xs">
                        Abo
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground mb-4">
                    {booking.customer_name && (
                      <div>
                        <span className="font-medium text-foreground">Kunde:</span>{' '}
                        {booking.customer_name}
                      </div>
                    )}
                    {booking.customer_email && (
                      <div>
                        <span className="font-medium text-foreground">E-Mail:</span>{' '}
                        {booking.customer_email}
                      </div>
                    )}
                    {booking.customer_phone && (
                      <div>
                        <span className="font-medium text-foreground">Telefon:</span>{' '}
                        {booking.customer_phone}
                      </div>
                    )}
                    {booking.company_name && (
                      <div>
                        <span className="font-medium text-foreground">Firma:</span>{' '}
                        {booking.company_name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">
                        {(booking.total_amount_cents / 100).toFixed(2)} {booking.currency?.toUpperCase() || 'EUR'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>
                        {new Date(booking.created_at).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div>{getStatusBadge(booking.status)}</div>
                  </div>

                  {booking.session_id && (
                    <div className="mt-2 text-xs text-muted-foreground font-mono">
                      Session: {booking.session_id.substring(0, 30)}...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
