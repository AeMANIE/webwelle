'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { User, Eye, EyeOff, Mail, Lock, Shield, ArrowLeft } from 'lucide-react';

export default function CustomerLogin() {
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
      const response = await fetch('/api/auth/request-tan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setTanSent(true);
        setStep('tan');
        
        // Für Entwicklung: TAN automatisch setzen
        if (data.tan) {
          setTan(data.tan);
          console.log('🔑 TAN für Entwicklung:', data.tan);
        }
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

    try {
      const response = await fetch('/api/auth/verify-tan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, tan }),
      });

      const data = await response.json();

      if (response.ok) {
        // Token in Cookie speichern
        document.cookie = `auth-token=${data.token}; path=/; max-age=86400; secure; samesite=strict`;
        router.push('/customer');
      } else {
        setError(data.error || 'TAN-Verifizierung fehlgeschlagen');
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
                {step === 'login' ? (
                  <User className="w-8 h-8 text-primary" />
                ) : (
                  <Shield className="w-8 h-8 text-primary" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {step === 'login' ? 'Kundenportal' : 'Zwei-Faktor-Authentifizierung'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {step === 'login' 
                  ? 'Melden Sie sich an, um Ihre Buchungen und Rechnungen einzusehen'
                  : 'Geben Sie den 6-stelligen Code ein, den wir Ihnen per E-Mail gesendet haben'
                }
              </p>
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
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="ihre@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Passwort
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {tanSent && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-lg">
                    ✓ TAN wurde an {email} gesendet
                    {tan && (
                      <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-500 text-center">
                        <strong>Entwicklung: TAN = {tan}</strong>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    6-stelliger Code
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={tan}
                      onChange={(e) => setTan(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent text-center text-2xl tracking-widest"
                      placeholder="123456"
                      maxLength={6}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Der Code ist 10 Minuten gültig
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="flex-1 bg-muted text-muted-foreground py-3 px-4 rounded-lg hover:bg-muted/80 transition-colors font-semibold flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zurück
                  </button>
                  <button
                    type="submit"
                    disabled={loading || tan.length !== 6}
                    className="flex-1 bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Wird verifiziert...' : 'Verifizieren'}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {step === 'login' 
                  ? (
                    <>
                      Noch kein Konto?{' '}
                      <a href="/register" className="text-primary hover:underline">
                        Hier registrieren
                      </a>
                      <br />
                      <a href="/forgot-password" className="text-primary hover:underline text-sm">
                        Passwort vergessen?
                      </a>
                    </>
                  )
                  : 'Haben Sie keinen Code erhalten? Prüfen Sie Ihren Spam-Ordner.'
                }
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
