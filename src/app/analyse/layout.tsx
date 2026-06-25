import type { Metadata } from 'next';
import { ROBOTS_NOINDEX } from '@/lib/seo-index';

export const metadata: Metadata = {
  title: 'Analyse | WebWelle',
  robots: ROBOTS_NOINDEX,
};

export default function AnalyseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
