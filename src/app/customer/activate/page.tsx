'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
// validatePassword wird über API Route aufgerufen (spart Bundle-Size)

interface ActivationInfo {
  email?: string;
  customerExists?: boolean;
  portalActivated?: boolean;
  customerName?: string;
  companyName?: string;
  vatId?: string;
  purpose?: string;
}

function ActivateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [vatId, setVatId] = useState('');
  const [activationInfo, setActivationInfo] = useState<ActivationInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const isActiveExistingCustomer =
    activationInfo?.purpose === 'existing_customer_link' || Boolean(activationInfo?.portalActivated);
  
  useEffect(() => {
    if (!token) {
      setError('Kein Aktivierungstoken gefunden');
      setValidating(false);
      setLoading(false);
      return;
    }
    
    // Token validieren
    validateToken();
  }, [token]);
  
  const validateToken = async () => {
    try {
      const response = await fetch(`/api/customer/validate-activation-token?token=${encodeURIComponent(token!)}`);
      const data = await response.json();
      
      if (!data.valid) {
        setError(data.error || 'Token ungültig oder abgelaufen');
      } else {
        setActivationInfo(data);
        setVatId(data.vatId || '');
      }
    } catch (err) {
      setError('Fehler beim Validieren des Tokens');
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!isActiveExistingCustomer || showPasswordSetup || password || confirmPassword) {
      if (!password) {
        setError('Bitte geben Sie ein neues Passwort ein');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwörter stimmen nicht überein');
        return;
      }
    } else {
      router.push('/customer/login?redirectTo=%2Fcustomer%3Ftab%3Danalysis');
      return;
    }
    
    // Passwort über API validieren (spart Bundle-Size, da zxcvbn groß ist)
    try {
      const validationResponse = await fetch('/api/validate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const validationData = await validationResponse.json();
      
      if (!validationData.isValid) {
        setError(validationData.feedback?.join(', ') || 'Passwort erfüllt nicht die Anforderungen');
        return;
      }
    } catch {
      setError('Fehler bei der Passwort-Validierung');
      return;
    }
    
    try {
      const response = await fetch('/api/customer/activate-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, vatId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(data.redirectTo || '/customer?tab=analysis');
        }, 900);
      } else {
        setError(data.error || 'Fehler beim Aktivieren');
      }
    } catch (err) {
      setError('Fehler beim Aktivieren des Portals');
    }
  };
  
  if (loading || validating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }
  
  if (error && !token) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-card rounded-lg p-6 border border-border">
              <h1 className="text-2xl font-bold text-foreground mb-4">Fehler</h1>
              <p className="text-muted-foreground">{error}</p>
              <a 
                href="/customer/login" 
                className="mt-4 inline-block text-brand hover:underline"
              >
                Zum Login
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">Aktivierung erfolgreich</h1>
              <p className="text-muted-foreground mb-4">
                Ihr Kundenportal wurde aktiviert. Sie werden direkt zu Ihrer Analyse weitergeleitet.
              </p>
              <a 
                href="/customer?tab=analysis" 
                className="inline-block mt-4 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
              >
                Zur Website-Analyse
              </a>
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
      <main className="py-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-card rounded-2xl p-8 border border-border shadow-xl">
            <h1 className="text-2xl font-bold text-foreground mb-2">Kundenportal aktivieren</h1>
            <p className="text-muted-foreground mb-6">
              Richten Sie Ihr Portal ein und öffnen Sie danach direkt Ihre gespeicherte Website-Analyse.
            </p>
            <div className="grid gap-3 mb-6">
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">E-Mail-Adresse</p>
                <p className="font-semibold text-foreground">{activationInfo?.email || 'Wird aus dem Aktivierungslink gelesen'}</p>
              </div>
              {(activationInfo?.customerName || activationInfo?.companyName) && (
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Konto</p>
                  <p className="font-semibold text-foreground">
                    {[activationInfo.customerName, activationInfo.companyName].filter(Boolean).join(' | ')}
                  </p>
                </div>
              )}
              {activationInfo?.customerExists && (
                <div className="rounded-xl border border-brand/30 bg-brand/10 p-4 text-sm text-muted-foreground">
                  {isActiveExistingCustomer
                    ? 'Dieses Konto ist bereits aktiv. Ihre Analyse wurde mit dem bestehenden Portal verbunden. Sie können sich einloggen oder bei Bedarf ein neues Passwort setzen.'
                    : 'Dieses Konto existiert bereits. Sie können hier Ihr Portal mit der Analyse verbinden und bei Bedarf ein neues Passwort setzen. Bestehende Buchungen und Rechnungen bleiben erhalten.'}
                </div>
              )}
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}
            
            {isActiveExistingCustomer && !showPasswordSetup ? (
              <div className="space-y-3">
                <a
                  href="/customer/login?redirectTo=%2Fcustomer%3Ftab%3Danalysis"
                  className="block w-full rounded-lg bg-brand px-4 py-3 text-center font-semibold text-brand-foreground hover:bg-brand/90"
                >
                  Einloggen & Analyse ansehen
                </a>
                <button
                  type="button"
                  onClick={() => setShowPasswordSetup(true)}
                  className="w-full rounded-lg border border-border px-4 py-3 font-semibold text-foreground hover:bg-muted/40"
                >
                  Neues Passwort setzen
                </button>
                <a href="/forgot-password" className="block text-center text-sm text-brand hover:underline">
                  Passwort vergessen?
                </a>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  USt-ID (optional)
                </label>
                <input
                  type="text"
                  value={vatId}
                  onChange={(e) => setVatId(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  placeholder="DE123456789"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sie können die USt-ID später im Kundenportal ändern.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Neues Passwort
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  required={!isActiveExistingCustomer || showPasswordSetup}
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mindestens 8 Zeichen, Groß- und Kleinbuchstaben, Zahlen, Sonderzeichen
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Passwort bestätigen
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  required={!isActiveExistingCustomer || showPasswordSetup}
                  minLength={8}
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-brand text-brand-foreground py-3 px-4 rounded-lg hover:bg-brand/90 transition-colors font-semibold"
              >
                {isActiveExistingCustomer ? 'Passwort aktualisieren & Analyse ansehen' : 'Kundenportal aktivieren & Analyse ansehen'}
              </button>
            </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    }>
      <ActivateContent />
    </Suspense>
  );
}

