'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AdminTabs from '../../components/admin/AdminTabs';
import BookingsTab from '../../components/admin/BookingsTab';
import CustomersTab from '../../components/admin/CustomersTab';
import InvoicesTab from '../../components/admin/InvoicesTab';
import BlogTab from '../../components/admin/BlogTab';
import BlogJobsTab from '../../components/admin/BlogJobsTab';
import DatabaseTab from '../../components/admin/DatabaseTab';
import OffersTab from '../../components/admin/OffersTab';

type TabId = 'bookings' | 'customers' | 'invoices' | 'offers' | 'blog' | 'blog-jobs' | 'database';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('bookings');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const router = useRouter();

  // Prüfe URL-Parameter für Tab
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab') as TabId;
    if (tab && ['bookings', 'customers', 'invoices', 'offers', 'blog', 'blog-jobs', 'database'].includes(tab)) {
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Admin-Dashboard</h1>
              <p className="text-muted-foreground">Verwalten Sie Bestellungen, Kunden, Rechnungen und Blog-Artikel</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:bg-destructive/90 transition-colors"
            >
              Abmelden
            </button>
          </div>

          <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'bookings' && <BookingsTab />}
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'invoices' && <InvoicesTab />}
          {activeTab === 'offers' && <OffersTab />}
          {activeTab === 'blog' && <BlogTab />}
          {activeTab === 'blog-jobs' && <BlogJobsTab />}
          {activeTab === 'database' && <DatabaseTab />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
