import type { Metadata } from 'next';
import { ROBOTS_NOINDEX } from '@/lib/seo-index';

export const metadata: Metadata = {
  title: 'Registrierung | WebWelle',
  description: 'Kundenregistrierung bei WebWelle',
  robots: ROBOTS_NOINDEX,
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
