'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
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

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tan, setTan] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'login' | 'tan'>('login');
  const [tanSent, setTanSent] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin-request-tan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTanSent(true);
        setStep('tan');
        // TAN wird NICHT angezeigt (Sicherheit)
        // Admin muss TAN aus E-Mail eingeben
      } else {
        setError(data.error || 'Login fehlgeschlagen');
      }
    } catch {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleTANSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // E-Mail normalisieren
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedTan = tan.trim();

    try {
      const response = await fetch('/api/auth/admin-verify-tan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalizedEmail, tan: normalizedTan }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Token wird bereits als HttpOnly Cookie gesetzt (vom Server)
        // Zusätzlich als Fallback im Client (für Kompatibilität)
        if (data.token) {
          document.cookie = `auth-token=${data.token}; path=/; max-age=86400; secure; samesite=strict`;
        }
        
        // Kurze Verzögerung, damit Cookie gesetzt wird
        setTimeout(() => {
          router.push('/admin');
          router.refresh();
        }, 100);
      } else {
        const errorMsg = data.error || 'TAN-Verifizierung fehlgeschlagen';
        setError(errorMsg);
      }
    } catch {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep('login');
    setTan('');
    setError('');
    setTanSent(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-2xl p-8 border border-border">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <LockIcon />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Admin Login
              </h1>
              <p className="text-muted-foreground mt-2">
                {step === 'login' 
                  ? 'Melden Sie sich an, um auf den Admin-Bereich zuzugreifen'
                  : 'Geben Sie den TAN-Code aus Ihrer E-Mail ein'}
              </p>
              {step === 'tan' && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Zwei-Faktor-Authentifizierung aktiviert</span>
                </div>
              )}
            </div>

            {step === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-6">
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
                  placeholder="test@deinemail.com"
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
                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'TAN wird gesendet...' : 'TAN anfordern'}
              </button>
            </form>
            ) : (
              <form onSubmit={handleTANSubmit} className="space-y-6">
                {tanSent && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-lg text-sm">
                    ✅ TAN wurde an Ihre E-Mail-Adresse gesendet. Bitte prüfen Sie Ihr Postfach.
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    TAN-Code
                  </label>
                  <input
                    type="text"
                    required
                    value={tan}
                    onChange={(e) => setTan(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="flex-1 bg-muted text-foreground py-3 px-4 rounded-lg hover:bg-muted/80 transition-colors font-semibold"
                  >
                    Zurück
                  </button>
                  <button
                    type="submit"
                    disabled={loading || tan.length !== 6}
                    className="flex-1 bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Wird verifiziert...' : 'Anmelden'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {step === 'login' 
                  ? 'Verwenden Sie Ihre Admin-Zugangsdaten'
                  : 'Geben Sie den TAN-Code aus Ihrer E-Mail ein'}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
