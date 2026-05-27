'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CheckCircle, XCircle, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setMessage('Kein Verifikations-Token gefunden');
      setLoading(false);
      return;
    }

    // Simuliere E-Mail-Verifikation
    const verifyEmail = async () => {
      try {
        // In Produktion würde hier ein API-Call gemacht werden
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setSuccess(true);
        setMessage('Ihre E-Mail-Adresse wurde erfolgreich bestätigt!');
        
        // Nach 3 Sekunden zum Login weiterleiten
        setTimeout(() => {
          router.push('/customer/login');
        }, 3000);
      } catch {
        setSuccess(false);
        setMessage('Fehler bei der E-Mail-Verifikation. Bitte versuchen Sie es erneut.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-card rounded-2xl p-8 border border-border text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">E-Mail wird verifiziert...</p>
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
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-2xl p-8 border border-border text-center">
            {success ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
            
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {success ? 'E-Mail bestätigt!' : 'Verifikation fehlgeschlagen'}
            </h1>
            
            <p className="text-muted-foreground mb-6">
              {message}
            </p>
            
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-green-500 mr-2" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Sie werden automatisch zum Login weitergeleitet...
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => router.push('/customer/login')}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Zum Login
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Zur Startseite
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-20">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-card rounded-2xl p-8 border border-border text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Lädt...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
