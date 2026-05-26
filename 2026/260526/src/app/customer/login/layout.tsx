import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kunden Login | WebWelle',
  description: 'Kundenportal Login',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: 'https://webwelle.com/customer/login',
  },
};

export default function CustomerLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

