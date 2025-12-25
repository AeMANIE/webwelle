'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Trash2, Mail, Key, Download, Send, ArrowLeft, Package, FileText, CreditCard, User, Building, Phone, Calendar } from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  company_name?: string;
  customer_number?: string;
  portal_activated: boolean;
  created_at: string;
}

interface Booking {
  id: string;
  package_type: string;
  status: string;
  total_amount_cents: number;
  currency: string;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  company_name?: string;
}

interface Invoice {
  id: string;
  invoice_number?: string;
  number?: string;
  stripe_invoice_id?: string;
  amount_cents?: number;
  amount?: number;
  currency?: string;
  status: string;
  paid_at?: string;
  due_date?: string;
  pdf_url?: string;
  hosted_invoice_url?: string;
  created_at?: string;
}

interface Subscription {
  id: string;
  status: string;
  cancelAt?: string;
  canceledAt?: string;
  currentPeriodEnd?: string;
  items: Array<{
    priceId: string;
    productId: string | null;
    recurring?: string;
    amount: number;
    currency?: string;
  }>;
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    loadCustomerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const loadCustomerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
        setBookings(data.bookings || []);
        setInvoices(data.invoices || []);
        setSubscriptions(data.subscriptions || []);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unbekannter Fehler' }));
        setError(errorData.error || 'Fehler beim Laden der Kundendaten');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Kundendaten');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading('delete');
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/admin?tab=customers');
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Fehler beim Löschen' }));
        alert(`Fehler: ${errorData.error}`);
      }
    } catch (err) {
      alert(`Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    } finally {
      setActionLoading(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleResetPassword = async () => {
    setActionLoading('reset-password');
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/reset-password`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        alert(`✅ Passwort zurückgesetzt! Neues Passwort: ${data.newPassword}`);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Fehler beim Zurücksetzen' }));
        alert(`Fehler: ${errorData.error}`);
      }
    } catch (err) {
      alert(`Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    } finally {
      setActionLoading(null);
      setShowResetPasswordConfirm(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailMessage) {
      alert('Bitte füllen Sie Betreff und Nachricht aus');
      return;
    }

    setActionLoading('send-email');
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          message: emailMessage,
        }),
      });
      if (res.ok) {
        alert('✅ E-Mail erfolgreich gesendet!');
        setShowEmailModal(false);
        setEmailSubject('');
        setEmailMessage('');
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Fehler beim Senden' }));
        alert(`Fehler: ${errorData.error}`);
      }
    } catch (err) {
      alert(`Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendInvoiceEmail = async (invoiceId: string) => {
    setActionLoading(`send-invoice-${invoiceId}`);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/send-email`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('✅ Rechnung erfolgreich per E-Mail gesendet!');
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Fehler beim Senden' }));
        alert(`Fehler: ${errorData.error}`);
      }
    } catch (err) {
      alert(`Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getPackageName = (packageType: string): string => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
              <p>{error || 'Kunde nicht gefunden'}</p>
              <button
                onClick={() => router.push('/admin?tab=customers')}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Zurück zu Kunden
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header mit Aktionen */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin?tab=customers')}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{customer.name || 'Kein Name'}</h1>
                <p className="text-muted-foreground">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Mail className="w-4 h-4" />
                E-Mail senden
              </button>
              <button
                onClick={() => setShowResetPasswordConfirm(true)}
                disabled={actionLoading !== null}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                Passwort zurücksetzen
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={actionLoading !== null}
                className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Löschen
              </button>
            </div>
          </div>

          {/* Kundeninformationen */}
          <div className="bg-card rounded-lg p-6 border border-border mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Kundeninformationen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium text-foreground">{customer.name || 'Kein Name'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">E-Mail</div>
                  <div className="font-medium text-foreground">{customer.email}</div>
                </div>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Telefon</div>
                    <div className="font-medium text-foreground">{customer.phone}</div>
                  </div>
                </div>
              )}
              {customer.company_name && (
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Firma</div>
                    <div className="font-medium text-foreground">{customer.company_name}</div>
                  </div>
                </div>
              )}
              {customer.customer_number && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Kundennummer</div>
                    <div className="font-mono font-medium text-foreground">{customer.customer_number}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Registriert am</div>
                  <div className="font-medium text-foreground">
                    {new Date(customer.created_at).toLocaleDateString('de-DE')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  {customer.portal_activated ? (
                    <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs">Portal aktiviert</span>
                  ) : (
                    <span className="bg-gray-500/10 text-gray-500 px-2 py-1 rounded text-xs">Portal nicht aktiviert</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pakete/Buchungen */}
          <div className="bg-card rounded-lg p-6 border border-border mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Package className="w-5 h-5" />
                Pakete & Buchungen ({bookings.length})
              </h2>
            </div>
            {bookings.length === 0 ? (
              <div className="text-muted-foreground">Keine Buchungen gefunden</div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-foreground mb-2">{getPackageName(booking.package_type)}</div>
                        <div className="text-sm text-muted-foreground">
                          Erstellt: {new Date(booking.created_at).toLocaleString('de-DE')}
                        </div>
                        <div className="mt-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            booking.status === 'paid' 
                              ? 'bg-green-500/10 text-green-500' 
                              : booking.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            {booking.status === 'paid' ? 'Bezahlt' : booking.status === 'pending' ? 'Ausstehend' : booking.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground text-lg">
                          {((booking.total_amount_cents || 0) / 100).toFixed(2)} {booking.currency || 'EUR'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rechnungen */}
          <div className="bg-card rounded-lg p-6 border border-border mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Rechnungen ({invoices.length})
            </h2>
            {invoices.length === 0 ? (
              <div className="text-muted-foreground">Keine Rechnungen gefunden</div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-mono font-semibold text-foreground mb-2">
                          {invoice.invoice_number || invoice.number || 'Keine Nummer'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Erstellt: {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('de-DE') : 'Unbekannt'}
                          {invoice.paid_at && ` • Bezahlt: ${new Date(invoice.paid_at).toLocaleDateString('de-DE')}`}
                          {invoice.due_date && ` • Fällig: ${new Date(invoice.due_date).toLocaleDateString('de-DE')}`}
                        </div>
                        <div className="mt-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            invoice.status === 'paid' 
                              ? 'bg-green-500/10 text-green-500' 
                              : invoice.status === 'open'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            {invoice.status === 'paid' ? 'Bezahlt' : invoice.status === 'open' ? 'Offen' : invoice.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col gap-2">
                        <div className="font-bold text-foreground">
                          {invoice.amount 
                            ? invoice.amount.toFixed(2) 
                            : invoice.amount_cents 
                            ? (invoice.amount_cents / 100).toFixed(2) 
                            : '0.00'} {invoice.currency || 'EUR'}
                        </div>
                        <div className="flex gap-2">
                          {invoice.pdf_url && (
                            <a
                              href={invoice.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors flex items-center gap-1"
                            >
                              <Download className="w-4 h-4" />
                              PDF
                            </a>
                          )}
                          <button
                            onClick={() => handleSendInvoiceEmail(invoice.id)}
                            disabled={actionLoading === `send-invoice-${invoice.id}`}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <Send className="w-4 h-4" />
                            {actionLoading === `send-invoice-${invoice.id}` ? 'Sende...' : 'E-Mail'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Abonnements */}
          {subscriptions.length > 0 && (
            <div className="bg-card rounded-lg p-6 border border-border mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Abonnements ({subscriptions.length})
              </h2>
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-foreground mb-2">Abonnement {sub.id.substring(0, 20)}...</div>
                        <div className="text-sm text-muted-foreground">
                          Status: {sub.status}
                          {sub.currentPeriodEnd && ` • Endet: ${new Date(sub.currentPeriodEnd).toLocaleDateString('de-DE')}`}
                        </div>
                        {sub.items && sub.items.length > 0 && (
                          <div className="mt-2">
                            {sub.items.map((item, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground">
                                {item.amount} {item.currency} / {item.recurring || 'monatlich'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4">Kunde löschen?</h3>
            <p className="text-muted-foreground mb-6">
              Möchten Sie den Kunden <strong>{customer.name || customer.email}</strong> wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50"
              >
                {actionLoading === 'delete' ? 'Lösche...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation Modal */}
      {showResetPasswordConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4">Passwort zurücksetzen?</h3>
            <p className="text-muted-foreground mb-6">
              Möchten Sie das Passwort für <strong>{customer.name || customer.email}</strong> zurücksetzen?
              Ein neues zufälliges Passwort wird generiert.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowResetPasswordConfirm(false)}
                className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80"
              >
                Abbrechen
              </button>
              <button
                onClick={handleResetPassword}
                disabled={actionLoading === 'reset-password'}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                {actionLoading === 'reset-password' ? 'Zurücksetzen...' : 'Zurücksetzen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-2xl w-full mx-4 border border-border max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-foreground mb-4">E-Mail an {customer.name || customer.email} senden</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Betreff</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded"
                  placeholder="Betreff der E-Mail"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Nachricht</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded min-h-[200px]"
                  placeholder="Nachricht an den Kunden..."
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailSubject('');
                  setEmailMessage('');
                }}
                className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSendEmail}
                disabled={actionLoading === 'send-email' || !emailSubject || !emailMessage}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
              >
                {actionLoading === 'send-email' ? 'Sende...' : 'Senden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

