'use client';

import { useEffect, useState } from 'react';

interface Booking {
  id: string;
  sessionId: string;
  packageType: string;
  packageName: string;
  isMonthly: boolean;
  checkoutMode: string;
  packagePriceDisplay?: string;
  totalAmount: string;
  currency: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerNumber: string | null;
  companyName: string | null;
  status: string;
  createdAt: string;
  selectedAddons?: unknown[] | null;
  designStyle: string | null;
  message: string | null;
  stripePaymentIntentId?: string | null;
}

export default function BookingsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [packageTypeFilter, setPackageTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('6months'); // 1month, 3months, 6months, 1year, custom
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
    const loadBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const dateRangeObj = getDateRange();
        const params = new URLSearchParams();
        
        if (dateRangeObj.start) params.append('startDate', dateRangeObj.start);
        if (dateRangeObj.end) params.append('endDate', dateRangeObj.end);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (packageTypeFilter !== 'all') params.append('packageType', packageTypeFilter);

        const res = await fetch(`/api/admin/bookings?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          console.log('Bestellungen geladen:', data.length, data);
          setBookings(Array.isArray(data) ? data : []);
        } else {
          const errorData = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }));
          console.error('Fehler beim Laden der Buchungen:', res.status, errorData);
          setError(`Fehler ${res.status}: ${errorData.error || 'Unbekannter Fehler'}`);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Buchungen:', error);
        setError(error instanceof Error ? error.message : 'Fehler beim Laden der Bestellungen');
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [statusFilter, packageTypeFilter, dateRange, customStartDate, customEndDate]);

  if (loading) {
    return <div className="text-center py-8">Lade Bestellungen...</div>;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
          <strong className="block mb-2">❌ Fehler beim Laden der Bestellungen:</strong>
          <p className="text-sm">{error}</p>
          <p className="text-sm mt-2">Bitte prüfen Sie:</p>
          <ul className="text-sm mt-2 ml-4 list-disc">
            <li>Ob die DATABASE_URL in .env.local korrekt ist</li>
            <li>Ob die Datenbank erreichbar ist</li>
            <li>Die Browser-Konsole für detaillierte Fehlermeldungen</li>
          </ul>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      paid: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Bezahlt' },
      pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', label: 'Ausstehend' },
      failed: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Fehlgeschlagen' },
      cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Storniert' },
    };
    const style = styles[status] || { bg: 'bg-gray-500/10', text: 'text-gray-500', label: status };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bestellungen ({bookings.length})</h2>
          <p className="text-muted-foreground mt-1">Alle Buchungen und Bestellungen</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-card p-4 rounded-lg border border-border space-y-4">
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
              <option value="pending">Ausstehend</option>
              <option value="failed">Fehlgeschlagen</option>
              <option value="cancelled">Storniert</option>
            </select>
          </div>

          {/* Package-Type-Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Paket</label>
            <select
              value={packageTypeFilter}
              onChange={(e) => setPackageTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded"
            >
              <option value="all">Alle</option>
              <option value="starterwelle">StarterWelle</option>
              <option value="businesswelle">BusinessWelle</option>
              <option value="erfolgswelle">ErfolgsWelle</option>
              <option value="flowwelle">FlowWelle</option>
              <option value="powerwelle">PowerWelle</option>
              <option value="meisterwelle">MeisterWelle</option>
              <option value="minijob">Mini Job</option>
              <option value="midijob">Midi Job</option>
              <option value="festangestellt">Festangestellt</option>
            </select>
          </div>
        </div>
      </div>

      {/* Buchungen-Liste */}
      {bookings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Keine Bestellungen gefunden.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-card rounded-lg p-6 border border-border hover:border-primary/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">{booking.packageName}</h3>
                    {getStatusBadge(booking.status)}
                    {booking.isMonthly && (
                      <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-xs">
                        Monatlich
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    <div>Erstellt: {new Date(booking.createdAt).toLocaleString('de-DE')}</div>
                    {booking.customerNumber && (
                      <div>Kundennummer: <span className="font-mono">{booking.customerNumber}</span></div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">
                    {booking.totalAmount} {booking.currency}
                  </div>
                  {booking.packagePriceDisplay && (
                    <div className="text-sm text-muted-foreground">{booking.packagePriceDisplay}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Kundeninformationen</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div><strong>Name:</strong> {booking.customerName || 'N/A'}</div>
                    <div><strong>E-Mail:</strong> {booking.customerEmail || 'N/A'}</div>
                    {booking.customerPhone && <div><strong>Telefon:</strong> {booking.customerPhone}</div>}
                    {booking.companyName && <div><strong>Firma:</strong> {booking.companyName}</div>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Details</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div><strong>Checkout:</strong> {booking.checkoutMode === 'subscription' ? 'Abonnement' : 'Einmalzahlung'}</div>
                    {booking.designStyle && <div><strong>Design-Stil:</strong> {booking.designStyle}</div>}
                    {booking.selectedAddons && Array.isArray(booking.selectedAddons) && booking.selectedAddons.length > 0 && (
                      <div><strong>Add-ons:</strong> {(booking.selectedAddons as unknown[]).length}</div>
                    )}
                    {booking.stripePaymentIntentId && (
                      <div className="text-xs font-mono text-muted-foreground">
                        Payment: {booking.stripePaymentIntentId.substring(0, 20)}...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {booking.message && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-2">Nachricht</h4>
                  <p className="text-sm text-muted-foreground">{booking.message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
