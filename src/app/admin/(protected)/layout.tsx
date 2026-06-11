import { requireServerSession } from '@/lib/server-auth';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireServerSession('admin');
  return children;
}
