'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Users,
  FileText,
  PenLine,
  Newspaper,
  Database,
  Search,
} from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import BookingsTab from '../../components/admin/BookingsTab';
import CustomersTab from '../../components/admin/CustomersTab';
import InvoicesTab from '../../components/admin/InvoicesTab';
import BlogTab from '../../components/admin/BlogTab';
import BlogJobsTab from '../../components/admin/BlogJobsTab';
import DatabaseTab from '../../components/admin/DatabaseTab';
import OffersTab from '../../components/admin/OffersTab';
import SeoTab from '../../components/admin/SeoTab';

type TabId = 'bookings' | 'customers' | 'invoices' | 'offers' | 'blog' | 'blog-jobs' | 'seo' | 'database';

const TAB_META: Record<TabId, { title: string; subtitle: string }> = {
  bookings: {
    title: 'Bestellungen',
    subtitle: 'Alle Paketbuchungen und Zahlungsstatus im Überblick',
  },
  customers: {
    title: 'Kunden',
    subtitle: 'Kundenstammdaten, Portal-Zugang und Buchungshistorie',
  },
  invoices: {
    title: 'Rechnungen',
    subtitle: 'Rechnungsstellung, PDFs und Versand verwalten',
  },
  offers: {
    title: 'Leads & Angebote',
    subtitle: 'Funnel-Leads, Angebote und DocuSeal-Workflows',
  },
  blog: {
    title: 'Blog-Editor',
    subtitle: 'Artikel erstellen, bearbeiten und veröffentlichen',
  },
  'blog-jobs': {
    title: 'Kunden-Blog',
    subtitle: 'SEO-Pipeline-Jobs und generierte Artikel',
  },
  seo: {
    title: 'SEO',
    subtitle: 'Keyword-Research und Qualifizierung pro Pipeline-Job',
  },
  database: {
    title: 'Datenbank',
    subtitle: 'Tabellenstatus, Migrationen und Systemchecks',
  },
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('bookings');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab') as TabId;
    if (tab && Object.keys(TAB_META).includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/verify');
      const data = await response.json();

      if (data.authenticated && data.user?.role && ['TEAM', 'ADMIN', 'OWNER'].includes(data.user.role)) {
        setUser(data.user);
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth-Check fehlgeschlagen:', error);
      router.push('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/admin/login');
  };

  const handleNavChange = (id: string) => {
    const tab = id as TabId;
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  const navItems = useMemo(
    () => [
      { id: 'bookings', label: 'Bestellungen', icon: <Package className="h-4 w-4" /> },
      { id: 'customers', label: 'Kunden', icon: <Users className="h-4 w-4" /> },
      { id: 'invoices', label: 'Rechnungen', icon: <FileText className="h-4 w-4" /> },
      { id: 'offers', label: 'Leads & Angebote', icon: <FileText className="h-4 w-4" /> },
      { id: 'blog', label: 'Blog-Editor', icon: <PenLine className="h-4 w-4" /> },
      { id: 'blog-jobs', label: 'Kunden-Blog', icon: <Newspaper className="h-4 w-4" /> },
      { id: 'seo', label: 'SEO', icon: <Search className="h-4 w-4" /> },
      { id: 'database', label: 'Datenbank', icon: <Database className="h-4 w-4" /> },
    ],
    []
  );

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const meta = TAB_META[activeTab];

  return (
    <DashboardShell
      variant="admin"
      title={meta.title}
      subtitle={meta.subtitle}
      user={user}
      navItems={navItems}
      activeNavId={activeTab}
      onNavChange={handleNavChange}
      onLogout={handleLogout}
      breadcrumbs={[{ label: 'Dashboard' }, { label: meta.title }]}
    >
      {activeTab === 'bookings' && <BookingsTab />}
      {activeTab === 'customers' && <CustomersTab />}
      {activeTab === 'invoices' && <InvoicesTab />}
      {activeTab === 'offers' && <OffersTab />}
      {activeTab === 'blog' && <BlogTab />}
      {activeTab === 'blog-jobs' && <BlogJobsTab />}
      {activeTab === 'seo' && <SeoTab />}
      {activeTab === 'database' && <DatabaseTab />}
    </DashboardShell>
  );
}
