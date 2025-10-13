import Image from 'next/image';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import MobileMenu from './MobileMenu';

export default function Header() {
  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-1 hover:opacity-80 transition-opacity focus:outline-none focus:ring-0"
            >
              <Image
                src="/webwellelogo.svg"
                alt="WebWelle Logo"
                width={50}
                height={50}
                className="h-12 w-auto"
                priority
              />
              <div className="flex items-center">
                <Image
                  src="/webwellecom-weissihr.svg"
                  alt="WebWelle"
                  width={120}
                  height={32}
                  className="h-15 w-auto"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/#produkte" className="text-foreground hover:text-primary transition-colors font-medium">
              Produkte
            </Link>
            <Link href="/ai-agent" className="text-foreground hover:text-primary transition-colors font-medium">
              KI-Agenten
            </Link>
            <Link href="/#vorteile" className="text-foreground hover:text-primary transition-colors font-medium">
              Vorteile
            </Link>
            <Link href="/#leistungen" className="text-foreground hover:text-primary transition-colors font-medium">
              Leistungen
            </Link>
            <Link href="/#faq" className="text-foreground hover:text-primary transition-colors font-medium">
              FAQ
            </Link>
            <Link href="/#kontakt" className="text-foreground hover:text-primary transition-colors font-medium">
              Kontakt
            </Link>
            <Link href="/customer" className="text-primary hover:text-primary/80 transition-colors font-medium border border-primary px-3 py-1 rounded-md flex items-center space-x-1">
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link
              href="/#cta"
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Jetzt starten
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}