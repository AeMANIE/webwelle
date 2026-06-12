'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export interface DashboardBreadcrumb {
  label: string;
  href?: string;
}

interface DashboardShellProps {
  variant: 'admin' | 'customer';
  title: string;
  subtitle?: string;
  user: { name: string; email: string };
  navItems: DashboardNavItem[];
  activeNavId: string;
  onNavChange: (id: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
  breadcrumbs?: DashboardBreadcrumb[];
}

export default function DashboardShell({
  variant,
  title,
  subtitle,
  user,
  navItems,
  activeNavId,
  onNavChange,
  onLogout,
  children,
  breadcrumbs,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const portalLabel = variant === 'admin' ? 'Admin' : 'Kundenportal';

  const sidebar = (
    <aside
      className={cn(
        'flex h-full w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar',
        'lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <Image
            src="/icon.png"
            alt="WebWelle"
            width={32}
            height={32}
            className="rounded-lg shrink-0"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">WebWelle</p>
            <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
              {portalLabel}
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
          aria-label="Menü schließen"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = activeNavId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavChange(item.id);
                setSidebarOpen(false);
              }}
              className={cn(
                'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary shadow-[inset_3px_0_0_0_var(--sidebar-primary)]'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'bg-sidebar-accent/50 text-muted-foreground group-hover:text-primary'
                )}
              >
                {item.icon}
              </span>
              <span className="truncate flex-1 text-left">{item.label}</span>
              {item.badge != null && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/40 px-3 py-2.5">
          <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Overlay schließen"
        />
      )}

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {sidebar}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Menü öffnen"
          >
            <Menu className="h-5 w-5" />
          </button>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-primary transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground leading-tight">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
              )}
            </div>
            <div className="dashboard-content">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
