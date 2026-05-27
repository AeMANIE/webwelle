import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Passwort zurücksetzen | WebWelle',
  description: 'Passwort zurücksetzen',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: 'https://webwelle.com/reset-password',
  },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

