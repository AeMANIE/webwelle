import Header from '../components/Header';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import CookieBanner from '../components/CookieBanner';

export default function WiderrufLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <ScrollToTop />
      <CookieBanner />
    </>
  );
}
