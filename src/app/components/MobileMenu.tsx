'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function MobileMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          onClick={toggleMenu}
          className="text-foreground hover:text-primary focus:outline-none focus:text-primary"
          aria-label={isMenuOpen ? "Navigation schließen" : "Navigation öffnen"}
          aria-expanded={isMenuOpen}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card rounded-lg mt-2 border border-border">
            <Link href={{ pathname: '/', hash: 'produkte' }} className="block px-3 py-2 text-foreground hover:text-primary font-medium" onClick={closeMenu}>
              Webdesign-Pakete
            </Link>
            <Link href="/ai-agent" className="block px-3 py-2 text-foreground hover:text-primary font-medium" onClick={closeMenu}>
              KI & Automatisierung
            </Link>
            <Link href="/app-entwicklung" className="block px-3 py-2 text-foreground hover:text-primary font-medium" onClick={closeMenu}>
              App-Entwicklung
            </Link>
            <Link href="/blog" className="block px-3 py-2 text-foreground hover:text-primary font-medium" onClick={closeMenu}>
              Blog
            </Link>
            <Link href="/customer" className="flex items-center justify-center space-x-2 px-3 py-2 text-primary hover:text-primary/80 font-medium border border-primary rounded-md" onClick={closeMenu}>
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
