'use client';

import Image from 'next/image';
import Link from 'next/link';

interface DashboardAuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  variant?: 'admin' | 'customer';
}

export default function DashboardAuthLayout({
  title,
  subtitle,
  children,
  variant = 'customer',
}: DashboardAuthLayoutProps) {
  const portalLabel = variant === 'admin' ? 'Admin-Bereich' : 'Kundenportal';

  return (
    <div className="relative flex min-h-screen bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(102,153,255,0.12) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 90% 100%, rgba(140,54,201,0.1) 0%, transparent 50%)',
        }}
      />

      <div className="relative hidden w-[42%] flex-col justify-between border-r border-border bg-card p-10 lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/icon.png" alt="WebWelle" width={40} height={40} className="rounded-xl" />
          <span className="text-xl font-bold text-foreground">WebWelle</span>
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{portalLabel}</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-foreground">
            Professionell verwaltet.
            <br />
            <span className="text-primary">Sicher eingeloggt.</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Ihr geschützter Bereich für Bestellungen, Rechnungen und Projektdaten – im WebWelle
            Corporate Design.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">© WebWelle · Alle Rechte vorbehalten</p>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <Image src="/icon.png" alt="WebWelle" width={36} height={36} className="rounded-lg" />
          <span className="text-lg font-bold text-foreground">WebWelle</span>
        </Link>
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-xl shadow-black/20 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
