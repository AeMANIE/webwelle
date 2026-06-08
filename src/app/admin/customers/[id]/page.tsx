'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  company_name?: string;
  vat_id?: string;
  customer_number?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  portal_activated?: boolean;
  created_at?: string;
}

interface Booking {
  id: string;
  package_type: string;
  status: string;
  total_amount_cents: number;
  currency: string;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number?: string;
  amount_cents?: number;
  amount?: number;
  currency?: string;
  status: string;
  pdf_url?: string;
  hosted_invoice_url?: string;
  created_at?: string;
  paid_at?: string;
}

interface FunnelAnalysis {
  id: string;
  token: string;
  status: string;
  industry_raw?: string;
  industry_normalized?: string;
  postal_code?: string;
  city?: string;
  market?: string;
  design_reference_urls?: string[];
  existing_website?: boolean | null;
  existing_website_url?: string | null;
  updated_at?: string;
  research: Array<{
    workflow_key: string;
    status: string;
    payload: Record<string, unknown> | null;
    error_message?: string;
    updated_at?: string;
  }>;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [funnelAnalyses, setFunnelAnalyses] = useState<FunnelAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Bearbeitungs-Modus
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Customer>>({});
  const [saving, setSaving] = useState(false);
  
  // E-Mail-Modus
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (customerId) {
      loadCustomerDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const loadCustomerDetails = async () => {
    try {
      const response = await fetch(`/api/admin/customers?id=${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
        setBookings(data.bookings || []);
        setInvoices(data.invoices || []);
        setFunnelAnalyses(data.funnelAnalyses || []);
        setEditData(data.customer);
      } else {
        setError('Kunde nicht gefunden');
      }
    } catch {
      setError('Fehler beim Laden der Kundendaten');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const data = await response.json();
        // Aktualisiere Customer-Daten mit den zurückgegebenen Daten
        setCustomer(data.customer);
        // Aktualisiere auch editData, damit die Adresse im Bearbeitungsmodus korrekt ist
        setEditData(data.customer);
        setIsEditing(false);
        setError('');
        // Lade Daten neu, um sicherzustellen, dass alles aktuell ist
        await loadCustomerDetails();
      } else {
        const data = await response.json();
        setError(data.error || 'Fehler beim Speichern');
      }
    } catch {
      setError('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const customerName = customer?.name || customer?.email || 'diesen Kunden';
    const confirmMessage = `Möchten Sie ${customerName} wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden. Alle zugehörigen Daten (Bestellungen, Rechnungen, etc.) werden ebenfalls gelöscht.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Kunde wurde erfolgreich gelöscht');
        router.push('/admin?tab=customers');
      } else {
        const data = await response.json();
        setError(data.error || 'Fehler beim Löschen. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      setError('Fehler beim Löschen. Bitte versuchen Sie es erneut.');
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Möchten Sie dem Kunden eine Passwort-Reset-E-Mail senden?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/customers/${customerId}/reset-password`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Passwort-Reset-E-Mail wurde erfolgreich gesendet');
      } else {
        const data = await response.json();
        setError(data.error || 'Fehler beim Senden der E-Mail');
      }
    } catch {
      setError('Fehler beim Senden der E-Mail');
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailMessage) {
      setError('Betreff und Nachricht sind erforderlich');
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          message: emailMessage,
        }),
      });

      if (response.ok) {
        alert('E-Mail wurde erfolgreich gesendet');
        setShowEmailForm(false);
        setEmailSubject('');
        setEmailMessage('');
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || 'Fehler beim Senden der E-Mail');
      }
    } catch {
      setError('Fehler beim Senden der E-Mail');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center">Lade Kundendaten...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
            <button
              onClick={() => router.push('/admin?tab=customers')}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Zurück zur Kundenliste
            </button>
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
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/admin?tab=customers')}
                className="text-primary hover:underline mb-2"
              >
                ← Zurück zur Kundenliste
              </button>
              <h1 className="text-3xl font-bold text-foreground">
                {isEditing ? 'Kunde bearbeiten' : 'Kundendetails'}
              </h1>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={handleResetPassword}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Passwort zurücksetzen
                  </button>
                  <button
                    onClick={() => setShowEmailForm(!showEmailForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    E-Mail senden
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
                  >
                    Löschen
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData(customer || {});
                    }}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? 'Speichern...' : 'Speichern'}
                  </button>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* E-Mail-Formular */}
          {showEmailForm && (
            <div className="mb-6 bg-card rounded-lg p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4">E-Mail an Kunde senden</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Betreff</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    placeholder="Betreff der E-Mail"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nachricht</label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    placeholder="Ihre Nachricht an den Kunden..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowEmailForm(false);
                      setEmailSubject('');
                      setEmailMessage('');
                    }}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {sendingEmail ? 'Wird gesendet...' : 'E-Mail senden'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Kunden-Informationen */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-card rounded-lg p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4">Kontaktinformationen</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">E-Mail</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground mt-1"
                    />
                  ) : (
                    <p className="text-foreground">{customer?.email}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground mt-1"
                    />
                  ) : (
                    <p className="text-foreground">{customer?.name || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Telefon</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground mt-1"
                    />
                  ) : (
                    <p className="text-foreground">{customer?.phone || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Firma</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.company_name || ''}
                      onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground mt-1"
                    />
                  ) : (
                    <p className="text-foreground">{customer?.company_name || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">USt-ID</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.vat_id || ''}
                      onChange={(e) => setEditData({ ...editData, vat_id: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground mt-1"
                      placeholder="DE123456789"
                    />
                  ) : (
                    <p className="text-foreground">{customer?.vat_id || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Kundennummer</label>
                  <p className="text-foreground font-mono">{customer?.customer_number || '—'}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4">Adresse</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Straße</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.street || ''}
                      onChange={(e) => setEditData({ ...editData, street: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground mt-1"
                      placeholder="Straße und Hausnummer"
                    />
                  ) : (
                    <p className="text-foreground">{customer?.street || '—'}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">PLZ</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.zip || ''}
                        onChange={(e) => setEditData({ ...editData, zip: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground mt-1"
                        placeholder="PLZ"
                      />
                    ) : (
                      <p className="text-foreground">{customer?.zip || '—'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Stadt</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.city || ''}
                        onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground mt-1"
                        placeholder="Stadt"
                      />
                    ) : (
                      <p className="text-foreground">{customer?.city || '—'}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Land</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.country || ''}
                      onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground mt-1"
                      placeholder="Land"
                    />
                  ) : (
                    <p className="text-foreground">{customer?.country || '—'}</p>
                  )}
                </div>
                <div className="pt-3 border-t border-border">
                  <label className="text-sm text-muted-foreground">Portal-Status</label>
                  <p className="text-foreground">
                    {customer?.portal_activated ? (
                      <span className="text-green-500">✓ Aktiviert</span>
                    ) : (
                      <span className="text-muted-foreground">Nicht aktiviert</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Funnel-Analysen */}
          <div className="bg-card rounded-lg p-6 border border-border mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Website-Analysen ({funnelAnalyses.length})
            </h2>
            {funnelAnalyses.length > 0 ? (
              <div className="space-y-4">
                {funnelAnalyses.map((analysis) => {
                  const researchByKey = Object.fromEntries(
                    analysis.research.map((item) => [item.workflow_key, item])
                  );
                  const performancePayload = researchByKey.site_performance?.payload || {};
                  const sites = performancePayload.sites;
                  const siteCount = Array.isArray(sites)
                    ? sites.length
                    : sites && typeof sites === 'object'
                      ? Object.keys(sites).length
                      : Number(performancePayload.receivedSites || 0);
                  const workflowStatuses = analysis.research.map((item) => `${item.workflow_key}: ${item.status}`);

                  return (
                    <div key={analysis.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {analysis.industry_normalized || analysis.industry_raw || 'Website-Analyse'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {analysis.postal_code} {analysis.city} · {analysis.market || 'DE'} · Status: {analysis.status}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Website:{' '}
                            {analysis.existing_website === true ? (
                              analysis.existing_website_url ? (
                                <a
                                  href={analysis.existing_website_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary underline"
                                >
                                  {analysis.existing_website_url}
                                </a>
                              ) : (
                                'Bestehend (URL fehlt)'
                              )
                            ) : analysis.existing_website === false ? (
                              'Neue Website gewünscht'
                            ) : (
                              'Noch nicht angegeben'
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Analysefortschritt: {Math.min(5, siteCount)} / 5 Websites
                          </p>
                        </div>
                        <a
                          href={`/funnel-5?t=${encodeURIComponent(analysis.token)}`}
                          className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                        >
                          Funnel öffnen
                        </a>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded bg-background/70 p-3 border border-border">
                          <p className="text-sm font-medium">Workflow-Status</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {workflowStatuses.length ? workflowStatuses.join(' · ') : 'Noch keine Research-Daten'}
                          </p>
                        </div>
                        <div className="rounded bg-background/70 p-3 border border-border">
                          <p className="text-sm font-medium">Lieblings-Webseiten</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {(analysis.design_reference_urls || []).length
                              ? (analysis.design_reference_urls || []).join(' · ')
                              : 'Keine gespeichert'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">Keine Funnel-Analyse für diesen Kunden gefunden</p>
            )}
          </div>

          {/* Bestellungen */}
          <div className="bg-card rounded-lg p-6 border border-border mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Bestellungen ({bookings.length})</h2>
            {bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-border rounded p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-foreground">{booking.package_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {(booking.total_amount_cents / 100).toFixed(2)} {booking.currency?.toUpperCase()}
                        </p>
                        <p className={`text-sm ${booking.status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                          {booking.status}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Keine Bestellungen</p>
            )}
          </div>

          {/* Rechnungen */}
          <div className="bg-card rounded-lg p-6 border border-border mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Rechnungen ({invoices.length})</h2>
            {invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="border border-border rounded p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-mono text-foreground">{invoice.invoice_number || '—'}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('de-DE') : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {invoice.amount 
                            ? `${invoice.amount.toFixed(2)} ${invoice.currency || 'EUR'}`
                            : invoice.amount_cents 
                              ? `${(invoice.amount_cents / 100).toFixed(2)} ${invoice.currency || 'EUR'}`
                              : '—'}
                        </p>
                        <p className={`text-sm ${invoice.status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                          {invoice.status}
                        </p>
                        {invoice.pdf_url && (
                          <a
                            href={invoice.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm hover:underline"
                          >
                            PDF öffnen
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Keine Rechnungen</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

