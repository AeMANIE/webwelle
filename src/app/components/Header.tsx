'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

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
              {/* Logo Bild */}
              <Image
                src="/logo250.png"
                alt="WebWelle Logo"
                width={50}
                height={50}
                className="h-12 w-auto"
                priority
              />
              
              {/* Logo Text SVG */}
              <div className="flex items-center">
                <Image
                  src="/webwellecom-weissihr.svg"
                  alt="WebWelle"
                  width={120}
                  height={32}
                  className="h-15 w-auto"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/#produkte" className="text-foreground hover:text-primary transition-colors font-medium">
              Produkte
            </Link>
            <Link href="/#vorteile" className="text-foreground hover:text-primary transition-colors font-medium">
              Vorteile
            </Link>
            <Link href="/#leistungen" className="text-foreground hover:text-primary transition-colors font-medium">
              Leistungen
            </Link>
            <Link href="/#arbeitsweise" className="text-foreground hover:text-primary transition-colors font-medium">
              Arbeitsweise
            </Link>
            <Link href="/#faq" className="text-foreground hover:text-primary transition-colors font-medium">
              FAQ
            </Link>
            <Link href="/#kontakt" className="text-foreground hover:text-primary transition-colors font-medium">
              Kontakt
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

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-foreground hover:text-primary focus:outline-none focus:text-primary"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card rounded-lg mt-2 border border-border">
              <Link href="/#produkte" className="block px-3 py-2 text-foreground hover:text-primary font-medium" onClick={closeMenu}>
                Produkte
              </Link>
              <Link href="/#vorteile" className="block px-3 py-2 text-foreground hover:text-primary font-medium" onClick={closeMenu}>
                Vorteile
              </Link>
              <Link href="/#leistungen" className="block px-3 py-2 text-foreground hover:text-primary font-medium" onClick={closeMenu}>
                Leistungen
              </Link>
              <Link href="/#arbeitsweise" className="block px-3 py-2 text-foreground hover:text-primary font-medium" onClick={closeMenu}>
                Arbeitsweise
              </Link>
              <Link href="/#faq" className="block px-3 py-2 text-foreground hover:text-primary font-medium" onClick={closeMenu}>
                FAQ
              </Link>
              <Link href="/#kontakt" className="block px-3 py-2 text-foreground hover:text-primary font-medium" onClick={closeMenu}>
                Kontakt
              </Link>
              <Link
                href="/#cta"
                className="block px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-center font-semibold"
                onClick={closeMenu}
              >
                Jetzt starten
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
