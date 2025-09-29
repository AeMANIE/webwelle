'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { LogOut, Package, Euro, Calendar, FileText, Eye } from 'lucide-react';

interface CustomerBooking {
  id: number;
  session_id: string;
  package_type: string;
  is_monthly: boolean;
  company_name: string;
  status: string;
  created_at: string;
  stripe_payment_intent_id?: string;
}

export default function CustomerPortal() {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const router = useRouter();

  const checkAuth = useCallback(() => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];
    
    if (!token) {
      router.push('/customer/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch {
      router.push('/customer/login');
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
    fetchCustomerBookings();
  }, [checkAuth]);

  const handleLogout = () => {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/customer/login');
  };

  const fetchCustomerBookings = async () => {
    try {
      const response = await fetch('/api/customer/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
  } catch {
    console.error('Fehler beim Laden der Buchungen');
  } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Bezahlt';
      case 'pending':
        return 'Ausstehend';
      case 'failed':
        return 'Fehlgeschlagen';
      default:
        return status;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Customer Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Mein Kundenportal
              </h1>
              <p className="text-muted-foreground">
                Willkommen, {user.name}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:bg-destructive/90 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Meine Buchungen</p>
                  <p className="text-2xl font-bold text-foreground">{bookings.length}</p>
                </div>
                <Package className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bezahlte Projekte</p>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter(b => b.status === 'paid').length}
                  </p>
                </div>
                <Euro className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Laufende Projekte</p>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Bookings */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Meine Buchungen
            </h2>
            <p className="text-muted-foreground">
              Übersicht aller Ihrer Buchungen und Projekte
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-foreground">Lade Buchungen...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                Noch keine Buchungen vorhanden
              </p>
              <p className="text-muted-foreground mt-2">
                Sobald Sie eine Buchung tätigen, erscheint sie hier.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {booking.company_name}
                      </h3>
                      <p className="text-muted-foreground">
                        {booking.package_type === 'nextjs' ? 'React/Next.js Website' : 'WordPress Website'} - 
                        {booking.is_monthly ? ' Monatlich' : ' Einmalzahlung'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(booking.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Buchungs-ID: {booking.session_id}
                    </div>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors text-sm">
                        <Eye className="w-4 h-4" />
                        Details anzeigen
                      </button>
                      {booking.status === 'paid' && (
                        <button className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded hover:bg-primary/10 transition-colors text-sm">
                          <FileText className="w-4 h-4" />
                          Rechnung
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
