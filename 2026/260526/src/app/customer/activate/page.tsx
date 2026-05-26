'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
// validatePassword wird über API Route aufgerufen (spart Bundle-Size)

function ActivateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
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
    
    // Validierung
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
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
        body: JSON.stringify({ token, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/customer/login');
        }, 3000);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
                className="mt-4 inline-block text-primary hover:underline"
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
              <h1 className="text-2xl font-bold text-foreground mb-4">✅ Aktivierung erfolgreich!</h1>
              <p className="text-muted-foreground mb-4">
                Ihr Kundenportal wurde aktiviert. Sie werden zum Login weitergeleitet...
              </p>
              <a 
                href="/customer/login" 
                className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Jetzt anmelden
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
        <div className="max-w-md mx-auto px-4">
          <div className="bg-card rounded-lg p-8 border border-border">
            <h1 className="text-2xl font-bold text-foreground mb-2">Kundenportal aktivieren</h1>
            <p className="text-muted-foreground mb-6">
              Bitte geben Sie ein Passwort für Ihr Kundenportal ein.
            </p>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Passwort
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
                  required
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
                  required
                  minLength={8}
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
              >
                Portal aktivieren
              </button>
            </form>
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <ActivateContent />
    </Suspense>
  );
}

