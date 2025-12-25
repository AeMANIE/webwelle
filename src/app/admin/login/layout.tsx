import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login | WebWelle',
  description: 'Admin-Bereich Login',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: 'https://webwelle.com/admin/login',
  },
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

