import type { Metadata } from 'next';
import Link from 'next/link';
import { ROBOTS_NOINDEX } from '@/lib/seo-index';

export const metadata: Metadata = {
  title: 'Seite nicht gefunden | WebWelle',
  robots: ROBOTS_NOINDEX,
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-foreground mb-4">Seite nicht gefunden</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
