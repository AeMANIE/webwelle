'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardAuthLayout from '../../components/dashboard/DashboardAuthLayout';
import { Shield } from 'lucide-react';

// Einfache SVG-Icons ohne externe Abhängigkeiten
const LockIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

type LoginStep = 'credentials' | 'tan';

export default function AdminLogin() {
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tan, setTan] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tanSent, setTanSent] = useState(false);
  const [trustPreview, setTrustPreview] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (step !== 'credentials') return;

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setTrustPreview(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ scope: 'admin', email: normalizedEmail });
        const response = await fetch(`/api/auth/tan-trust-status?${params}`, {
          credentials: 'include',
        });
        const data = await response.json();
        setTrustPreview(Boolean(data.trusted));
      } catch {
        setTrustPreview(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [email, step]);

  // Schritt 1: TAN anfordern (Email + Passwort)
  const handleRequestTAN = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && !data.requiresTan) {
        setTimeout(() => {
          router.push('/admin');
          router.refresh();
        }, 100);
        return;
      }

      if (response.ok && data.success && data.requiresTan) {
        setTanSent(true);
        setStep('tan');
        if (data.tan) {
          console.log('🔑 TAN für Entwicklung:', data.tan);
        }
      } else {
        setError(data.error || 'Fehler beim Anfordern der TAN');
      }
    } catch {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  // Schritt 2: TAN verifizieren und einloggen
  const handleVerifyTAN = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin-verify-tan', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, tan }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Cookie wird serverseitig gesetzt
        setTimeout(() => {
          router.push('/admin');
          router.refresh();
        }, 100);
      } else {
        // Detaillierte Fehlermeldung vom Server anzeigen
        const errorMessage = data.error || 'Ungültiger TAN-Code';
        console.error('TAN-Verifizierung fehlgeschlagen:', errorMessage);
        setError(errorMessage);
      }
    } catch {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('credentials');
    setTan('');
    setTanSent(false);
    setError('');
  };

  return (
    <DashboardAuthLayout
      variant="admin"
      title={step === 'tan' ? 'TAN-Code eingeben' : 'Admin Login'}
      subtitle={
        step === 'tan'
          ? 'Geben Sie den TAN-Code ein, der an Ihre E-Mail gesendet wurde'
          : 'Melden Sie sich an, um auf den Admin-Bereich zuzugreifen'
      }
    >
            <div className="mb-6 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                {step === 'tan' ? <ShieldIcon /> : <LockIcon />}
              </div>
            </div>
            {step === 'tan' && (
              <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Zwei-Faktor-Authentifizierung aktiviert</span>
              </div>
            )}

            {step === 'credentials' ? (
              <form onSubmit={handleRequestTAN} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ihre Admin-E-Mail-Adresse"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Passwort
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand text-brand-foreground py-3 px-4 rounded-lg hover:bg-brand/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? trustPreview
                      ? 'Anmeldung...'
                      : 'TAN wird angefordert...'
                    : trustPreview
                      ? 'Anmelden'
                      : 'TAN anfordern'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyTAN} className="space-y-6">
                {tanSent && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-lg">
                    ✅ TAN wurde an {email} gesendet
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    TAN-Code (6-stellig)
                  </label>
                  <input
                    type="text"
                    required
                    value={tan}
                    onChange={(e) => setTan(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoComplete="one-time-code"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Der Code ist 10 Minuten gültig
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex-1 bg-muted text-foreground py-3 px-4 rounded-lg hover:bg-muted/80 transition-colors font-semibold disabled:opacity-50"
                  >
                    Zurück
                  </button>
                  <button
                    type="submit"
                    disabled={loading || tan.length !== 6}
                    className="flex-1 bg-brand text-brand-foreground py-3 px-4 rounded-lg hover:bg-brand/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Wird angemeldet...' : 'Anmelden'}
                  </button>
                </div>
              </form>
            )}

            {step === 'credentials' && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  🔒 Zwei-Faktor-Authentifizierung aktiviert
                </p>
              </div>
            )}
    </DashboardAuthLayout>
  );
}
