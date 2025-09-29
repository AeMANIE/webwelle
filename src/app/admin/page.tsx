'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { LogOut, User, Calendar, Package, Euro } from 'lucide-react';

interface Booking {
  id: number;
  session_id: string;
  package_type: string;
  is_monthly: boolean;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  company_name: string;
  existing_website: string;
  target_group: string[];
  design_style: string;
  functions: string[];
  budget: string;
  message?: string;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const router = useRouter();

  const checkAuth = useCallback(() => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];
    
    if (!token) {
      router.push('/admin/login');
      return;
    }

    // Token validieren (vereinfacht)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch {
      router.push('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
    fetchBookings();
  }, [checkAuth]);

  const handleLogout = () => {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/admin/login');
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-foreground">Lade Buchungen...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
          {/* Admin Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Willkommen zurück, {user.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-foreground font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:bg-destructive/90 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Abmelden
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt Buchungen</p>
                  <p className="text-2xl font-bold text-foreground">{bookings.length}</p>
                </div>
                <Package className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bezahlte Buchungen</p>
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
                  <p className="text-sm text-muted-foreground">Ausstehend</p>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fehlgeschlagen</p>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter(b => b.status === 'failed').length}
                  </p>
                </div>
                <User className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Alle Buchungen
            </h2>
            <p className="text-muted-foreground">
              Detaillierte Übersicht aller eingehenden Buchungsanfragen
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Noch keine Buchungen vorhanden
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
                        {booking.customer_name} ({booking.customer_email})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        booking.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status === 'paid' ? 'Bezahlt' : 
                         booking.status === 'pending' ? 'Ausstehend' : 'Fehlgeschlagen'}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(booking.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Paket</h4>
                      <p className="text-muted-foreground">
                        {booking.package_type === 'nextjs' ? 'React/Next.js Website' : 'WordPress Website'} - 
                        {booking.is_monthly ? ' Monatlich' : ' Einmalzahlung'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Budget</h4>
                      <p className="text-muted-foreground">{booking.budget}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Design-Stil</h4>
                      <p className="text-muted-foreground capitalize">{booking.design_style}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Bestehende Website</h4>
                      <p className="text-muted-foreground">{booking.existing_website}</p>
                    </div>
                  </div>

                  {booking.functions && booking.functions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-foreground mb-2">Gewünschte Funktionen</h4>
                      <div className="flex flex-wrap gap-2">
                        {booking.functions.map((func, index) => (
                          <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                            {func}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {booking.message && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-foreground mb-2">Nachricht</h4>
                      <p className="text-muted-foreground bg-muted/50 p-3 rounded">
                        {booking.message}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Session ID: {booking.session_id}
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`mailto:${booking.customer_email}`}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors text-sm"
                      >
                        E-Mail senden
                      </a>
                      {booking.customer_phone && (
                        <a
                          href={`tel:${booking.customer_phone}`}
                          className="border border-primary text-primary px-4 py-2 rounded hover:bg-primary/10 transition-colors text-sm"
                        >
                          Anrufen
                        </a>
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
