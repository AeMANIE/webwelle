'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Package,
  Users,
  FileText,
  PenLine,
  Newspaper,
  Database,
  Search,
  Megaphone,
} from 'lucide-react';
import DashboardShell from '../../../../components/dashboard/DashboardShell';
import OutboundProspectDetail from '../../../../components/admin/OutboundProspectDetail';

const ADMIN_NAV = [
  { id: 'bookings', label: 'Bestellungen', icon: <Package className="h-4 w-4" /> },
  { id: 'customers', label: 'Kunden', icon: <Users className="h-4 w-4" /> },
  { id: 'invoices', label: 'Rechnungen', icon: <FileText className="h-4 w-4" /> },
  { id: 'offers', label: 'Leads & Angebote', icon: <FileText className="h-4 w-4" /> },
  { id: 'marketing', label: 'Marketing', icon: <Megaphone className="h-4 w-4" /> },
  { id: 'blog', label: 'Blog-Editor', icon: <PenLine className="h-4 w-4" /> },
  { id: 'blog-jobs', label: 'Kunden-Blog', icon: <Newspaper className="h-4 w-4" /> },
  { id: 'seo', label: 'SEO', icon: <Search className="h-4 w-4" /> },
  { id: 'database', label: 'Datenbank', icon: <Database className="h-4 w-4" /> },
];

export default function MarketingProspectPage() {
  const params = useParams();
  const prospectId = params.id as string;
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/verify');
      const data = await response.json();
      if (data.authenticated && data.user?.role && ['TEAM', 'ADMIN', 'OWNER'].includes(data.user.role)) {
        setUser(data.user);
      } else {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* */ }
    router.push('/admin/login');
  };

  const handleNavChange = (id: string) => {
    router.push(`/admin?tab=${id}`);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <DashboardShell
      variant="admin"
      title="Outbound Prospect"
      subtitle="Angebot prüfen, PDF und E-Mail versenden"
      user={user}
      navItems={ADMIN_NAV}
      activeNavId="marketing"
      onNavChange={handleNavChange}
      onLogout={handleLogout}
      breadcrumbs={[
        { label: 'Dashboard' },
        { label: 'Marketing', href: '/admin?tab=marketing' },
        { label: prospectId.slice(0, 8) },
      ]}
    >
      <OutboundProspectDetail prospectId={prospectId} />
    </DashboardShell>
  );
}
