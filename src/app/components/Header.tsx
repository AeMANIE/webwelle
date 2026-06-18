'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogIn, Menu, X } from 'lucide-react';
import { useLayoutMode } from '@/hooks/useLayoutMode';
import { navigateToHomeTop } from '@/lib/scroll-to-anchor';

export default function Header() {
  const layoutMode = useLayoutMode();
  const isMobileHeader = layoutMode !== 'desktop';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (layoutMode === 'desktop') {
      setIsMenuOpen(false);
    }
  }, [layoutMode]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    closeMenu();
    navigateToHomeTop();
  };

  return (
    <header className="bg-background backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-0"
              aria-label="Zur Startseite"
            >
              <Image
                src="/webwellelogo.svg"
                alt="WebWelle Logo"
                width={50}
                height={50}
                className="h-12 w-auto"
                style={{ width: 'auto' }}
                priority
              />
              <img
                src="/webwellecom-weissihr.svg"
                alt="WebWelle"
                width={180}
                height={48}
                className="h-12 w-auto"
                fetchPriority="high"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          {!isMobileHeader && (
          <nav className="flex items-center space-x-6">
            <Link href="/leistungen" className="text-foreground hover:text-primary transition-colors font-medium py-2 px-1">
              Leistungen
            </Link>
            <Link href="/app-entwicklung" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap py-2 px-1">
              App-Entwicklung
            </Link>
            <Link href="/blog" className="text-foreground hover:text-primary transition-colors font-medium py-2 px-1">
              Blog
            </Link>
            <Link href="/customer" prefetch={false} className="text-primary hover:text-primary/80 transition-colors font-medium border border-primary px-4 py-2 rounded-md flex items-center space-x-1 hover:bg-primary/10">
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          </nav>
          )}

          {/* Mobile Menu Button */}
          {isMobileHeader && (
          <div>
            <button
              onClick={toggleMenu}
              className="text-foreground hover:text-primary focus:outline-none focus:text-primary p-2"
              aria-label={isMenuOpen ? "Navigation schließen" : "Navigation öffnen"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {isMobileHeader && isMenuOpen && (
          <div>
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card rounded-lg mt-2 border border-border shadow-lg">
              <Link href="/leistungen" className="block px-3 py-2 text-foreground hover:text-primary font-medium rounded-md hover:bg-primary/5" onClick={closeMenu}>
                Leistungen
              </Link>
              <Link href="/app-entwicklung" className="block px-3 py-2 text-foreground hover:text-primary font-medium rounded-md hover:bg-primary/5" onClick={closeMenu}>
                App-Entwicklung
              </Link>
              <Link href="/blog" className="block px-3 py-2 text-foreground hover:text-primary font-medium rounded-md hover:bg-primary/5" onClick={closeMenu}>
                Blog
              </Link>
              <div className="pt-2 border-t border-border">
                <Link href="/customer" prefetch={false} className="flex items-center justify-center space-x-2 px-3 py-2 text-primary hover:text-primary/80 font-medium border border-primary rounded-md hover:bg-primary/5" onClick={closeMenu}>
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}