'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { DashboardPanel, DashboardStatCard } from '../../components/dashboard/DashboardPanel';
import { Package, Euro, Calendar, FileText, Eye, Download, X, Plus, Settings } from 'lucide-react';
import DwaLeadSummary from '@/components/funnel/DwaLeadSummary';
import { dwaResumePath } from '@/lib/funnel/funnel-kind';
import { dwaLeadProductTitle } from '@/app/components/leistungen-offers';

type CustomerTabId = 'bookings' | 'addons' | 'analysis' | 'settings';

const CUSTOMER_TAB_META: Record<CustomerTabId, { title: string; subtitle: string }> = {
  bookings: {
    title: 'Meine Buchungen',
    subtitle: 'Ihre Pakete, Zahlungsstatus und Projektdetails',
  },
  addons: {
    title: 'Add-on Bestellungen',
    subtitle: 'Zusatzleistungen und Erweiterungen zu Ihren Paketen',
  },
  analysis: {
    title: 'Website-Analysen',
    subtitle: 'Funnel-Forschung und SEO-Ergebnisse',
  },
  settings: {
    title: 'Einstellungen',
    subtitle: 'Kontodaten, USt-ID und Abonnement verwalten',
  },
};

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

interface FunnelAnalysis {
  id: string;
  token: string;
  status: string;
  funnel_kind?: string;
  source?: string;
  industry_raw?: string;
  industry_normalized?: string;
  postal_code?: string;
  city?: string;
  market?: string;
  project_brief?: string | null;
  project_notes?: string | null;
  solution_selection?: { selectedIds?: string[] } | null;
  zoom_booking_confirmed?: boolean;
  design_reference_urls?: string[];
  existing_website?: boolean | null;
  existing_website_url?: string | null;
  updated_at?: string;
  research: Array<{
    workflow_key: string;
    status: string;
    payload: Record<string, unknown> | null;
    updated_at: string;
  }>;
}

export default function CustomerPortal() {
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [addonOrders, setAddonOrders] = useState<AddonOrder[]>([]);
  const [funnelAnalyses, setFunnelAnalyses] = useState<FunnelAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);
  const [customerNumber, setCustomerNumber] = useState<string | null>(null);
  const [vatId, setVatId] = useState('');
  const [vatSaving, setVatSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    street: '',
    zip: '',
    city: '',
    country: 'DE',
    phone: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const isReadOnly = user?.role === 'VIEWER';
  const [selectedBooking, setSelectedBooking] = useState<CustomerBooking | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [activeTab, setActiveTab] = useState<CustomerTabId>('bookings');
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [selectedBookingForAddon, setSelectedBookingForAddon] = useState<CustomerBooking | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tab = new URLSearchParams(window.location.search).get('tab') as CustomerTabId;
    if (tab && Object.keys(CUSTOMER_TAB_META).includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const handleNavChange = (id: string) => {
    const tab = id as CustomerTabId;
    setActiveTab(tab);
    setProfileSuccess('');
    setProfileError('');
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/verify');
      const data = await response.json();
      if (data.authenticated && data.user?.role && ['VIEWER', 'MEMBER'].includes(data.user.role)) {
        setUser(data.user);
        return;
      }
      router.push('/customer/login');
    } catch {
      router.push('/customer/login');
    }
  }, [router]);

  const fetchCustomerBookings = useCallback(async () => {
    try {
      const response = await fetch('/api/customer-portal?action=bookings');
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
      const response = await fetch('/api/customer-portal?action=addon-orders');
      if (response.ok) {
        const data = await response.json();
        setAddonOrders(data.addonOrders || []);
      }
    } catch {
      console.error('Fehler beim Laden der Add-on Bestellungen');
    }
  }, [user?.email]);

  const fetchCustomerInfo = useCallback(async () => {
    if (!user?.email) return;
    try {
      const response = await fetch('/api/customer-portal?action=customer-info');
      if (response.ok) {
        const data = await response.json();
        setCustomerNumber(data.customerNumber || null);
        setVatId(data.vatId || '');
        setProfile({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          companyName: data.companyName || '',
          street: data.street || '',
          zip: data.zip || '',
          city: data.city || '',
          country: data.country || 'DE',
          phone: data.phone || '',
        });
      }
    } catch {
      console.error('Fehler beim Laden der Kundennummer');
    }
  }, [user?.email]);

  const fetchFunnelAnalyses = useCallback(async () => {
    if (!user?.email) return;
    try {
      const response = await fetch('/api/customer-portal?action=funnel-analysis');
      if (response.ok) {
        const data = await response.json();
        setFunnelAnalyses(data.analyses || []);
      }
    } catch {
      console.error('Fehler beim Laden der Website-Analysen');
    }
  }, [user?.email]);

  useEffect(() => {
    checkAuth();
    if (user?.email) {
      fetchCustomerBookings();
      fetchAddonOrders();
      fetchCustomerInfo();
      fetchFunnelAnalyses();
    }
  }, [checkAuth, user?.email, fetchCustomerBookings, fetchAddonOrders, fetchCustomerInfo, fetchFunnelAnalyses]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/customer/login');
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const response = await fetch('/api/customer-portal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      if (!response.ok) {
        setProfileError(data.message || 'Profil konnte nicht gespeichert werden.');
        return;
      }
      if (data.profile) {
        setProfile({
          firstName: data.profile.firstName || '',
          lastName: data.profile.lastName || '',
          companyName: data.profile.companyName || '',
          street: data.profile.street || '',
          zip: data.profile.zip || '',
          city: data.profile.city || '',
          country: data.profile.country || 'DE',
          phone: data.profile.phone || '',
        });
      }
      setProfileSuccess('Ihre Kontaktdaten wurden gespeichert.');
    } catch {
      setProfileError('Profil konnte nicht gespeichert werden.');
    } finally {
      setProfileSaving(false);
    }
  };

  const saveVatId = async () => {
    setVatSaving(true);
    try {
      const response = await fetch('/api/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-profile-vat', vatId }),
      });
      if (!response.ok) {
        alert('USt-ID konnte nicht gespeichert werden.');
      }
    } catch {
      alert('USt-ID konnte nicht gespeichert werden.');
    } finally {
      setVatSaving(false);
    }
  };

  const fetchBookingDetails = async (booking: CustomerBooking) => {
    try {
      setSelectedBooking(booking);
      setShowDetails(true);

      // Lade Rechnungen
      const invoicesResponse = await fetch(`/api/customer-portal?action=invoices&bookingId=${booking.id}`);
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData.invoices || []);
      }

      // Lade Subscription (falls monatlich)
      if (booking.isMonthly) {
        const subscriptionResponse = await fetch(`/api/customer-portal?action=subscription&bookingId=${booking.id}`);
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
        return 'bg-green-500/10 text-green-400';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'failed':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
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

  const navItems = useMemo(
    () => [
      {
        id: 'bookings',
        label: 'Meine Buchungen',
        icon: <Package className="h-4 w-4" />,
        badge: bookings.length > 0 ? bookings.length : undefined,
      },
      {
        id: 'addons',
        label: 'Add-ons',
        icon: <FileText className="h-4 w-4" />,
        badge: addonOrders.length > 0 ? addonOrders.length : undefined,
      },
      {
        id: 'analysis',
        label: 'Website-Analysen',
        icon: <Calendar className="h-4 w-4" />,
        badge: funnelAnalyses.length > 0 ? funnelAnalyses.length : undefined,
      },
    ],
    [bookings.length, addonOrders.length, funnelAnalyses.length]
  );

  const footerNavItems = useMemo(
    () => [
      {
        id: 'settings',
        label: 'Einstellungen',
        icon: <Settings className="h-4 w-4" />,
      },
    ],
    []
  );

  const tabMeta = CUSTOMER_TAB_META[activeTab];
  const shellSubtitle = customerNumber
    ? `Willkommen, ${user?.name ?? ''} · Kd.-Nr. ${customerNumber}`
    : `Willkommen, ${user?.name ?? ''}`;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardShell
      variant="customer"
      title={tabMeta.title}
      subtitle={shellSubtitle}
      user={user}
      navItems={navItems}
      footerNavItems={footerNavItems}
      activeNavId={activeTab}
      onNavChange={handleNavChange}
      onLogout={handleLogout}
      breadcrumbs={[{ label: 'Kundenportal' }, { label: tabMeta.title }]}
    >
          {activeTab === 'settings' ? (
            <div className="space-y-6">
              {profileError && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {profileError}
                </p>
              )}
              {profileSuccess && (
                <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                  {profileSuccess}
                </p>
              )}

              <DashboardPanel
                title="Meine Kontaktdaten"
                description="Name, Adresse und Erreichbarkeit für Rechnungen und Angebote"
                action={
                  isReadOnly ? (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      Nur Lesezugriff
                    </span>
                  ) : undefined
                }
              >
                <div className="mb-4 rounded-lg bg-muted/30 px-4 py-3 text-sm">
                  <p className="text-muted-foreground">E-Mail (Anmeldung)</p>
                  <p className="font-medium text-foreground">{user.email}</p>
                  {customerNumber && (
                    <p className="mt-2 text-muted-foreground">
                      Kundennummer:{' '}
                      <span className="font-mono text-foreground">{customerNumber}</span>
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Vorname</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      disabled={isReadOnly}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Nachname</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                      disabled={isReadOnly}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:opacity-60"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-foreground">Firma</label>
                    <input
                      type="text"
                      value={profile.companyName}
                      onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                      disabled={isReadOnly}
                      placeholder="Optional"
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:opacity-60"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-foreground">Straße</label>
                    <input
                      type="text"
                      value={profile.street}
                      onChange={(e) => setProfile({ ...profile, street: e.target.value })}
                      disabled={isReadOnly}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">PLZ</label>
                    <input
                      type="text"
                      value={profile.zip}
                      onChange={(e) => setProfile({ ...profile, zip: e.target.value })}
                      disabled={isReadOnly}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Stadt</label>
                    <input
                      type="text"
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      disabled={isReadOnly}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Land</label>
                    <select
                      value={profile.country}
                      onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                      disabled={isReadOnly}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:opacity-60"
                    >
                      <option value="DE">Deutschland</option>
                      <option value="AT">Österreich</option>
                      <option value="CH">Schweiz</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Telefon</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={isReadOnly}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:opacity-60"
                    />
                  </div>
                </div>
                {!isReadOnly && (
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={saveProfile}
                      disabled={profileSaving}
                      className="rounded-lg bg-brand px-4 py-2 text-brand-foreground hover:bg-brand/90 transition-colors disabled:opacity-60"
                    >
                      {profileSaving ? 'Speichert...' : 'Kontaktdaten speichern'}
                    </button>
                  </div>
                )}
              </DashboardPanel>

              <DashboardPanel
                title="USt-ID"
                description="Optional für Angebote, Rechnungen und Firmenprofil"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={vatId}
                      onChange={(e) => setVatId(e.target.value)}
                      placeholder="DE123456789"
                      disabled={isReadOnly}
                      className="w-full max-w-sm rounded-lg border border-border bg-background px-4 py-2 text-foreground disabled:opacity-60"
                    />
                  </div>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={saveVatId}
                      disabled={vatSaving}
                      className="rounded-lg bg-brand px-4 py-2 text-brand-foreground hover:bg-brand/90 transition-colors disabled:opacity-60"
                    >
                      {vatSaving ? 'Speichert...' : 'USt-ID speichern'}
                    </button>
                  )}
                </div>
              </DashboardPanel>

              <DashboardPanel
                title="Abonnement"
                description="Verwaltung Ihrer monatlichen Pakete und Kündigungen"
              >
                <p className="text-sm text-muted-foreground">
                  Die Abo-Verwaltung und Kündigung wird hier in Kürze ergänzt. Bis dahin können Sie
                  monatliche Abos in den Buchungsdetails unter „Meine Buchungen“ verwalten.
                </p>
              </DashboardPanel>
            </div>
          ) : (
            <>
          {activeTab === 'bookings' && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard
              label="Meine Buchungen"
              value={bookings.length}
              icon={<Package className="h-5 w-5" />}
            />
            <DashboardStatCard
              label="Add-on Bestellungen"
              value={addonOrders.length}
              icon={<FileText className="h-5 w-5" />}
            />
            <DashboardStatCard
              label="Bezahlte Projekte"
              value={bookings.filter((b) => b.status === 'paid').length}
              icon={<Euro className="h-5 w-5" />}
              iconClassName="bg-green-500/10 text-green-400"
            />
            <DashboardStatCard
              label="Website-Analysen"
              value={funnelAnalyses.length}
              icon={<Calendar className="h-5 w-5" />}
              iconClassName="bg-yellow-500/10 text-yellow-400"
            />
          </div>
          )}

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
                          className="flex items-center gap-2 bg-brand text-brand-foreground px-4 py-2 rounded hover:bg-brand/90 transition-colors text-sm"
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
          ) : activeTab === 'analysis' ? (
            funnelAnalyses.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">Noch keine Website-Analyse gespeichert</p>
                <p className="text-muted-foreground mt-2">
                  Sobald Sie den Funnel speichern, erscheint Ihre Analyse hier.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {funnelAnalyses.map((analysis) => {
                  const isDwa = analysis.funnel_kind === 'wachstumsarchitektur';
                  const resumeHref = isDwa
                    ? dwaResumePath(analysis.status, analysis.token)
                    : `/funnel-5?t=${encodeURIComponent(analysis.token)}`;

                  if (isDwa) {
                    const projectSolutions = analysis.research.find(
                      (r) => r.workflow_key === 'project_solutions'
                    );
                    return (
                      <div key={analysis.id} className="bg-card rounded-lg p-6 border border-border">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-foreground">
                              {dwaLeadProductTitle(analysis.source)}
                            </h3>
                            <p className="text-muted-foreground">
                              {analysis.industry_normalized || analysis.industry_raw} ·{' '}
                              {analysis.postal_code} {analysis.city}
                            </p>
                          </div>
                          <a
                            href={resumeHref}
                            className="bg-brand text-brand-foreground px-4 py-2 rounded hover:bg-brand/90 transition-colors text-sm text-center"
                          >
                            Anfrage fortsetzen
                          </a>
                        </div>
                        <div className="mt-4">
                          <DwaLeadSummary
                            token={analysis.token}
                            status={analysis.status}
                            industry_normalized={analysis.industry_normalized}
                            industry_raw={analysis.industry_raw}
                            project_brief={analysis.project_brief}
                            project_notes={analysis.project_notes}
                            solution_selection={analysis.solution_selection}
                            zoom_booking_confirmed={analysis.zoom_booking_confirmed}
                            variant="customer"
                          />
                        </div>
                        {projectSolutions && (
                          <p className="text-xs text-muted-foreground mt-3">
                            Projektanalyse: {projectSolutions.status}
                          </p>
                        )}
                      </div>
                    );
                  }

                  const researchByKey = Object.fromEntries(
                    analysis.research.map((item) => [item.workflow_key, item])
                  );
                  const performancePayload = researchByKey.site_performance?.payload || {};
                  const sitesValue = performancePayload.sites;
                  const siteCount = Array.isArray(sitesValue)
                    ? sitesValue.length
                    : sitesValue && typeof sitesValue === 'object'
                      ? Object.keys(sitesValue).length
                      : Number(performancePayload.receivedSites || 0);
                  const seoPayload = researchByKey.seo_keywords?.payload || {};
                  const keywordCount = Array.isArray(seoPayload.keywords) ? seoPayload.keywords.length : 0;
                  const designStatus = researchByKey.competitor_design?.status || 'offen';
                  const performanceStatus = researchByKey.site_performance?.status || 'offen';
                  const recommendationStatus = researchByKey.recommendation?.status || 'offen';
                  return (
                    <div key={analysis.id} className="bg-card rounded-lg p-6 border border-border">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">
                            {analysis.industry_normalized || analysis.industry_raw || 'Website-Analyse'}
                          </h3>
                          <p className="text-muted-foreground">
                            {analysis.postal_code} {analysis.city} · {analysis.market || 'DE'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {analysis.existing_website === true && analysis.existing_website_url ? (
                              <>
                                Ihre Website:{' '}
                                <a
                                  href={analysis.existing_website_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary underline"
                                >
                                  {analysis.existing_website_url}
                                </a>
                              </>
                            ) : analysis.existing_website === false ? (
                              'Ziel: neue Website'
                            ) : null}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Stand: {analysis.updated_at ? new Date(analysis.updated_at).toLocaleString('de-DE') : 'offen'}
                          </p>
                        </div>
                        <a
                          href={resumeHref}
                          className="bg-brand text-brand-foreground px-4 py-2 rounded hover:bg-brand/90 transition-colors text-sm text-center"
                        >
                          Analyse fortsetzen
                        </a>
                      </div>
                      <div className="mt-5 grid gap-3 md:grid-cols-4">
                        <div className="rounded-lg bg-background/70 p-4 border border-border">
                          <p className="text-xs text-muted-foreground">Fortschritt</p>
                          <p className="text-2xl font-bold">{Math.min(5, siteCount)} / 5</p>
                        </div>
                        <div className="rounded-lg bg-background/70 p-4 border border-border">
                          <p className="text-xs text-muted-foreground">Keywords</p>
                          <p className="text-2xl font-bold">{keywordCount}</p>
                        </div>
                        <div className="rounded-lg bg-background/70 p-4 border border-border">
                          <p className="text-xs text-muted-foreground">Design-Beispiele</p>
                          <p className="text-2xl font-bold">{(analysis.design_reference_urls || []).length}</p>
                        </div>
                        <div className="rounded-lg bg-background/70 p-4 border border-border">
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="text-sm font-semibold mt-2">{analysis.status}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg bg-background/70 p-4 border border-border">
                          <p className="text-xs text-muted-foreground">Design-Analyse</p>
                          <p className="font-semibold text-foreground">{designStatus}</p>
                        </div>
                        <div className="rounded-lg bg-background/70 p-4 border border-border">
                          <p className="text-xs text-muted-foreground">Performance</p>
                          <p className="font-semibold text-foreground">{performanceStatus}</p>
                        </div>
                        <div className="rounded-lg bg-background/70 p-4 border border-border">
                          <p className="text-xs text-muted-foreground">Empfehlung</p>
                          <p className="font-semibold text-foreground">{recommendationStatus}</p>
                        </div>
                      </div>
                      {(analysis.design_reference_urls || []).length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Gespeicherte Lieblings-Webseiten</p>
                          <div className="flex flex-wrap gap-2">
                            {(analysis.design_reference_urls || []).map((url) => (
                              <span key={url} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                                {url}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                          className="bg-brand text-brand-foreground px-4 py-2 rounded hover:bg-brand/90 transition-colors text-sm"
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
                          className="flex-1 bg-brand text-brand-foreground px-3 py-2 rounded hover:bg-brand/90 transition-colors text-sm"
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
                          className="flex-1 bg-brand text-brand-foreground px-3 py-2 rounded hover:bg-brand/90 transition-colors text-sm"
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
                          className="flex-1 bg-brand text-brand-foreground px-3 py-2 rounded hover:bg-brand/90 transition-colors text-sm"
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
                          className="flex-1 bg-brand text-brand-foreground px-3 py-2 rounded hover:bg-brand/90 transition-colors text-sm"
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
                          className="bg-brand text-brand-foreground px-4 py-2 rounded hover:bg-brand/90 transition-colors text-sm"
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
            </>
          )}
    </DashboardShell>
  );
}
