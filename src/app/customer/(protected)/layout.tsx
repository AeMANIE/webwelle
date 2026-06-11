import { requireServerSession } from '@/lib/server-auth';

export default async function CustomerProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireServerSession('customer');
  return children;
}
