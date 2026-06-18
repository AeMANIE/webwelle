import type { Metadata } from 'next';
import { requireServerSession } from '@/lib/server-auth';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CustomerProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireServerSession('customer');
  return children;
}
