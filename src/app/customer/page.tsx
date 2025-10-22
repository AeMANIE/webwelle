'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { LogOut, Package, Euro, Calendar, FileText, Eye, Download, X, Plus } from 'lucide-react';

interface CustomerBooking {
  id: string;
  packageType: string;
  packageName: string;
  isMonthly: boolean;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  packagePriceDisplay: string;
  selectedAddons: Array<Record<string, unknown>>;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt: string | null;
  pdfUrl: string | null;
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  cancelAtPeriodEnd: boolean;
  nextBillingDate: string | null;
  customerCancelled: boolean;
  cancellationReason: string | null;
}

interface AddonOrder {
  id: string;
  addonKey: string;
  addonLabel: string;
  billing: 'oneTime' | 'monthly';
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  checkoutMode: string;
}

export default function CustomerPortal() {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [addonOrders, setAddonOrders] = useState<AddonOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<CustomerBooking | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookings' | 'addons'>('bookings');
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [selectedBookingForAddon, setSelectedBookingForAddon] = useState<CustomerBooking | null>(null);
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

  const fetchCustomerBookings = useCallback(async () => {
    try {
      const response = await fetch(`/api/customer-portal?email=${encodeURIComponent(user?.email || '')}&action=bookings`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch {
      console.error('Fehler beim Laden der Buchungen');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  const fetchAddonOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/customer-portal?email=${encodeURIComponent(user?.email || '')}&action=addon-orders`);
      if (response.ok) {
        const data = await response.json();
        setAddonOrders(data.addonOrders || []);
      }
    } catch {
      console.error('Fehler beim Laden der Add-on Bestellungen');
    }
  }, [user?.email]);

  useEffect(() => {
    checkAuth();
    if (user?.email) {
      fetchCustomerBookings();
      fetchAddonOrders();
    }
  }, [checkAuth, user?.email, fetchCustomerBookings, fetchAddonOrders]);

  const handleLogout = () => {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/customer/login');
  };

  const fetchBookingDetails = async (booking: CustomerBooking) => {
    try {
      setSelectedBooking(booking);
      setShowDetails(true);

      // Lade Rechnungen
      const invoicesResponse = await fetch(`/api/customer-portal?email=${encodeURIComponent(user?.email || '')}&action=invoices&bookingId=${booking.id}`);
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData.invoices || []);
      }

      // Lade Subscription (falls monatlich)
      if (booking.isMonthly) {
        const subscriptionResponse = await fetch(`/api/customer-portal?email=${encodeURIComponent(user?.email || '')}&action=subscription&bookingId=${booking.id}`);
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          setSubscription(subscriptionData.subscription);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Buchungsdetails:', error);
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) return;

    setCancellingSubscription(true);
    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel-subscription',
          subscriptionId: subscription.id,
          reason: 'Kunde hat das Abonnement gekündigt',
        }),
      });

      if (response.ok) {
        // Aktualisiere die Subscription-Daten
        setSubscription(prev => prev ? { ...prev, customerCancelled: true, cancelAtPeriodEnd: true } : null);
        alert('Ihr Abonnement wurde erfolgreich gekündigt. Es läuft bis zum Ende der aktuellen Abrechnungsperiode.');
      } else {
        alert('Fehler beim Kündigen des Abonnements. Bitte versuchen Sie es später erneut.');
      }
    } catch (error) {
      console.error('Fehler beim Kündigen der Subscription:', error);
      alert('Fehler beim Kündigen des Abonnements. Bitte versuchen Sie es später erneut.');
    } finally {
      setCancellingSubscription(false);
    }
  };

  const orderAddon = async (addonKey: string, addonLabel: string, priceId: string, amountCents: number, billing: 'oneTime' | 'monthly') => {
    if (!selectedBookingForAddon) return;

    try {
      const response = await fetch('/api/addon-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBookingForAddon.id,
          addonKey,
          addonLabel,
          billing,
          priceId,
          amountCents,
          customerEmail: user?.email,
          customerName: user?.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Weiterleitung zu Stripe Checkout
        window.location.href = data.url;
      } else {
        const errorData = await response.json();
        alert(`Fehler beim Erstellen der Add-on Bestellung: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Fehler beim Bestellen des Add-ons:', error);
      alert('Fehler beim Bestellen des Add-ons. Bitte versuchen Sie es später erneut.');
    }
  };

  const openAddonModal = (booking: CustomerBooking) => {
    setSelectedBookingForAddon(booking);
    setShowAddonModal(true);
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  <p className="text-sm text-muted-foreground">Add-on Bestellungen</p>
                  <p className="text-2xl font-bold text-foreground">{addonOrders.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
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

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'bookings'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  Meine Buchungen ({bookings.length})
                </button>
                <button
                  onClick={() => setActiveTab('addons')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'addons'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  Add-on Bestellungen ({addonOrders.length})
                </button>
              </nav>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-foreground">Lade Daten...</p>
            </div>
          ) : activeTab === 'bookings' ? (
            bookings.length === 0 ? (
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
                          {booking.packageName}
                        </h3>
                        <p className="text-muted-foreground">
                          {booking.packagePriceDisplay} - 
                          {booking.isMonthly ? ' Monatlich' : ' Einmalzahlung'}
                        </p>
                        {booking.selectedAddons && booking.selectedAddons.length > 0 && (
                          <p className="text-sm text-primary mt-1">
                            +{booking.selectedAddons.length} Zusatzoptionen
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(booking.createdAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border">
                      <div className="text-sm text-muted-foreground">
                        Gesamtbetrag: {booking.totalAmount.toFixed(2)} {booking.currency.toUpperCase()}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => fetchBookingDetails(booking)}
                          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Details anzeigen
                        </button>
                        {booking.status === 'paid' && (
                          <>
                            <button className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded hover:bg-primary/10 transition-colors text-sm">
                              <FileText className="w-4 h-4" />
                              Rechnungen
                            </button>
                            <button 
                              onClick={() => openAddonModal(booking)}
                              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              Add-on bestellen
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            addonOrders.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">
                  Noch keine Add-on Bestellungen vorhanden
                </p>
                <p className="text-muted-foreground mt-2">
                  Zusätzliche Services können Sie über Ihr Hauptpaket bestellen.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {addonOrders.map((order) => (
                  <div key={order.id} className="bg-card rounded-lg p-6 border border-border">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {order.addonLabel}
                        </h3>
                        <p className="text-muted-foreground">
                          {order.billing === 'monthly' ? 'Monatlich' : 'Einmalzahlung'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Bestellt am: {new Date(order.createdAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order.amount.toFixed(2)} {order.currency.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border">
                      <div className="text-sm text-muted-foreground">
                        Bestell-ID: {order.id}
                      </div>
                      <div className="flex gap-2">
                        {order.status === 'paid' && (
                          <button className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded hover:bg-primary/10 transition-colors text-sm">
                            <FileText className="w-4 h-4" />
                            Rechnung anzeigen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Booking Details Modal */}
          {showDetails && selectedBooking && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-border">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-foreground">
                      {selectedBooking.packageName} - Details
                    </h2>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Package Info */}
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <h3 className="font-semibold text-foreground mb-2">Paket-Informationen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Paket</p>
                        <p className="font-medium">{selectedBooking.packageName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Zahlungsart</p>
                        <p className="font-medium">{selectedBooking.isMonthly ? 'Monatlich' : 'Einmalzahlung'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Preis</p>
                        <p className="font-medium">{selectedBooking.packagePriceDisplay}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                          {getStatusText(selectedBooking.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Add-ons */}
                  {selectedBooking.selectedAddons && selectedBooking.selectedAddons.length > 0 && (
                    <div className="bg-card rounded-lg p-4 border border-border">
                      <h3 className="font-semibold text-foreground mb-2">Zusatzoptionen</h3>
                      <div className="space-y-2">
                        {selectedBooking.selectedAddons.map((addon, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                            <span className="text-foreground">{String(addon.label || addon.key)}</span>
                            <span className="text-primary font-medium">{String(addon.price || 'Preis nicht verfügbar')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Invoices */}
                  {invoices.length > 0 && (
                    <div className="bg-card rounded-lg p-4 border border-border">
                      <h3 className="font-semibold text-foreground mb-2">Rechnungen</h3>
                      <div className="space-y-2">
                        {invoices.map((invoice) => (
                          <div key={invoice.id} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                            <div>
                              <span className="text-foreground font-medium">{invoice.invoiceNumber}</span>
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(invoice.status)}`}>
                                {getStatusText(invoice.status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-primary font-medium">
                                {invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                              </span>
                              {invoice.pdfUrl && (
                                <a
                                  href={invoice.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subscription Management */}
                  {subscription && (
                    <div className="bg-card rounded-lg p-4 border border-border">
                      <h3 className="font-semibold text-foreground mb-2">Abonnement-Verwaltung</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(subscription.status)}`}>
                              {getStatusText(subscription.status)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Nächste Abrechnung</p>
                            <p className="font-medium">
                              {subscription.nextBillingDate 
                                ? new Date(subscription.nextBillingDate).toLocaleDateString('de-DE')
                                : 'Nicht verfügbar'
                              }
                            </p>
                          </div>
                        </div>

                        {subscription.customerCancelled && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-yellow-800 text-sm">
                              Ihr Abonnement wurde gekündigt und läuft bis zum {new Date(subscription.currentPeriodEnd).toLocaleDateString('de-DE')}.
                            </p>
                          </div>
                        )}

                        {!subscription.customerCancelled && subscription.status === 'active' && (
                          <button
                            onClick={cancelSubscription}
                            disabled={cancellingSubscription}
                            className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded hover:bg-destructive/90 transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            {cancellingSubscription ? 'Wird gekündigt...' : 'Abonnement kündigen'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Add-on Bestellungs-Modal */}
          {showAddonModal && selectedBookingForAddon && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-border">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-foreground">
                      Add-on bestellen für {selectedBookingForAddon.packageName}
                    </h2>
                    <button
                      onClick={() => setShowAddonModal(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* AI-Agent */}
                    <div className="bg-card rounded-lg p-4 border border-border">
                      <h3 className="font-semibold text-foreground mb-2">AI-Agent</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Intelligenter Chatbot für Ihre Website
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-primary">299,99 €</span>
                        <button
                          onClick={() => orderAddon('ai-agent', 'AI-Agent', 'price_ai_agent', 29999, 'oneTime')}
                          className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors text-sm"
                        >
                          Bestellen
                        </button>
                      </div>
                    </div>

                    {/* Terminbuchung */}
                    <div className="bg-card rounded-lg p-4 border border-border">
                      <h3 className="font-semibold text-foreground mb-2">Terminbuchungs-System</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Online-Terminbuchung für Ihre Kunden
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Einmalig</span>
                          <span className="font-bold text-primary">1.599 €</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Monatlich</span>
                          <span className="font-bold text-primary">149 € mtl.</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => orderAddon('terminbuchung', 'Terminbuchungs-System', 'price_terminbuchung', 159900, 'oneTime')}
                          className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded hover:bg-primary/90 transition-colors text-sm"
                        >
                          Einmalig
                        </button>
                        <button
                          onClick={() => orderAddon('terminbuchung', 'Terminbuchungs-System', 'price_terminbuchung_monthly', 14900, 'monthly')}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                        >
                          Monatlich
                        </button>
                      </div>
                    </div>

                    {/* Online-Shop */}
                    <div className="bg-card rounded-lg p-4 border border-border">
                      <h3 className="font-semibold text-foreground mb-2">Online-Shop</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        E-Commerce-Lösung für Ihr Unternehmen
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Einmalig</span>
                          <span className="font-bold text-primary">2.999 €</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Monatlich</span>
                          <span className="font-bold text-primary">274,99 € mtl.</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => orderAddon('online-shop', 'Online-Shop', 'price_online_shop', 299900, 'oneTime')}
                          className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded hover:bg-primary/90 transition-colors text-sm"
                        >
                          Einmalig
                        </button>
                        <button
                          onClick={() => orderAddon('online-shop', 'Online-Shop', 'price_online_shop_monthly', 27499, 'monthly')}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                        >
                          Monatlich
                        </button>
                      </div>
                    </div>

                    {/* MitgliederWelle */}
                    <div className="bg-card rounded-lg p-4 border border-border">
                      <h3 className="font-semibold text-foreground mb-2">MitgliederWelle</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Mitgliederbereich für Ihre Website
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Einmalig</span>
                          <span className="font-bold text-primary">1.999 €</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Monatlich</span>
                          <span className="font-bold text-primary">199 € mtl.</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => orderAddon('mitglieder-welle', 'MitgliederWelle', 'price_mitglieder_welle', 199900, 'oneTime')}
                          className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded hover:bg-primary/90 transition-colors text-sm"
                        >
                          Einmalig
                        </button>
                        <button
                          onClick={() => orderAddon('mitglieder-welle', 'MitgliederWelle', 'price_mitglieder_welle_monthly', 19900, 'monthly')}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                        >
                          Monatlich
                        </button>
                      </div>
                    </div>

                    {/* Lieferdienst */}
                    <div className="bg-card rounded-lg p-4 border border-border">
                      <h3 className="font-semibold text-foreground mb-2">Lieferdienst-Integration</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Integration mit Lieferdiensten
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Einmalig</span>
                          <span className="font-bold text-primary">1.299 €</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Monatlich</span>
                          <span className="font-bold text-primary">129 € mtl.</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => orderAddon('lieferdienst', 'Lieferdienst-Integration', 'price_lieferdienst', 129900, 'oneTime')}
                          className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded hover:bg-primary/90 transition-colors text-sm"
                        >
                          Einmalig
                        </button>
                        <button
                          onClick={() => orderAddon('lieferdienst', 'Lieferdienst-Integration', 'price_lieferdienst_monthly', 12900, 'monthly')}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                        >
                          Monatlich
                        </button>
                      </div>
                    </div>

                    {/* Google My Business */}
                    <div className="bg-card rounded-lg p-4 border border-border">
                      <h3 className="font-semibold text-foreground mb-2">Google My Business</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Komplettservice für Google My Business
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-primary">399 €</span>
                        <button
                          onClick={() => orderAddon('google-my-business', 'Google My Business', 'price_google_my_business', 39900, 'oneTime')}
                          className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors text-sm"
                        >
                          Bestellen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
