'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogIn, Menu, X } from 'lucide-react';

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
            <Link href={{ pathname: '/', hash: 'produkte' }} className="text-foreground hover:text-primary transition-colors font-medium">
              Produkte
            </Link>
            <Link href="/ai-agent" className="text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap">
              KI-Agenten
            </Link>
            <Link href={{ pathname: '/', hash: 'vorteile' }} className="text-foreground hover:text-primary transition-colors font-medium">
              Vorteile
            </Link>
            <Link href={{ pathname: '/', hash: 'leistungen' }} className="text-foreground hover:text-primary transition-colors font-medium">
              Leistungen
            </Link>
            <Link href={{ pathname: '/', hash: 'faq' }} className="text-foreground hover:text-primary transition-colors font-medium">
              FAQ
            </Link>
            <Link href={{ pathname: '/', hash: 'kontakt' }} className="text-foreground hover:text-primary transition-colors font-medium">
              Kontakt
            </Link>
            <Link href="/customer" className="text-primary hover:text-primary/80 transition-colors font-medium border border-primary px-3 py-1 rounded-md flex items-center space-x-1">
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
          </nav>


          {/* Mobile Menu Button */}
          <div className="md:hidden">
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
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card rounded-lg mt-2 border border-border shadow-lg">
<<<<<<< HEAD
              <Link href={{ pathname: '/', hash: 'produkte' }} className="block px-3 py-2 text-foreground hover:text-primary font-medium rounded-md hover:bg-primary/5" onClick={closeMenu}>
=======
              <Link 
                href="/#produkte" 
                className="block px-3 py-2 text-foreground hover:text-primary font-medium rounded-md hover:bg-primary/5" 
                onClick={(e) => {
                  e.preventDefault();
                  closeMenu();
                  const element = document.getElementById('produkte');
                  if (element) {
                    const headerHeight = 80;
                    const elementPosition = element.offsetTop - headerHeight;
                    window.scrollTo({ top: elementPosition, behavior: 'smooth' });
                  }
                }}
              >
>>>>>>> 0ad31427903353d31e593ac7cb04fc5403870e20
                Produkte
              </Link>
              <Link href="/ai-agent" className="block px-3 py-2 text-foreground hover:text-primary font-medium rounded-md hover:bg-primary/5" onClick={closeMenu}>
                KI-Agenten
              </Link>
<<<<<<< HEAD
              <Link href={{ pathname: '/', hash: 'vorteile' }} className="block px-3 py-2 text-foreground hover:text-primary font-medium rounded-md hover:bg-primary/5" onClick={closeMenu}>
                Vorteile
              </Link>
              <Link href={{ pathname: '/', hash: 'leistungen' }} className="block px-3 py-2 text-foreground hover:text-primary font-medium rounded-md hover:bg-primary/5" onClick={closeMenu}>
                Leistungen
              </Link>
              <Link href={{ pathname: '/', hash: 'faq' }} className="block px-3 py-2 text-foreground hover:text-primary font-medium rounded-md hover:bg-primary/5" onClick={closeMenu}>
                FAQ
              </Link>
              <Link href={{ pathname: '/', hash: 'kontakt' }} className="block px-3 py-2 text-foreground hover:text-primary font-medium rounded-md hover:bg-primary/5" onClick={closeMenu}>
=======
              <Link 
                href="/#vorteile" 
                className="block px-3 py-2 text-foreground hover:text-primary font-medium rounded-md hover:bg-primary/5" 
                onClick={(e) => {
                  e.preventDefault();
                  closeMenu();
                  const element = document.getElementById('vorteile');
                  if (element) {
                    const headerHeight = 80;
                    const elementPosition = element.offsetTop - headerHeight;
                    window.scrollTo({ top: elementPosition, behavior: 'smooth' });
                  }
                }}
              >
                Vorteile
              </Link>
              <Link 
                href="/#leistungen" 
                className="block px-3 py-2 text-foreground hover:text-primary font-medium rounded-md hover:bg-primary/5" 
                onClick={(e) => {
                  e.preventDefault();
                  closeMenu();
                  const element = document.getElementById('leistungen');
                  if (element) {
                    const headerHeight = 80;
                    const elementPosition = element.offsetTop - headerHeight;
                    window.scrollTo({ top: elementPosition, behavior: 'smooth' });
                  }
                }}
              >
                Leistungen
              </Link>
              <Link 
                href="/#faq" 
                className="block px-3 py-2 text-foreground hover:text-primary font-medium rounded-md hover:bg-primary/5" 
                onClick={(e) => {
                  e.preventDefault();
                  closeMenu();
                  const element = document.getElementById('faq');
                  if (element) {
                    const headerHeight = 80;
                    const elementPosition = element.offsetTop - headerHeight;
                    window.scrollTo({ top: elementPosition, behavior: 'smooth' });
                  }
                }}
              >
                FAQ
              </Link>
              <Link 
                href="/#kontakt" 
                className="block px-3 py-2 text-foreground hover:text-primary font-medium rounded-md hover:bg-primary/5" 
                onClick={(e) => {
                  e.preventDefault();
                  closeMenu();
                  const element = document.getElementById('kontakt');
                  if (element) {
                    const headerHeight = 80;
                    const elementPosition = element.offsetTop - headerHeight;
                    window.scrollTo({ top: elementPosition, behavior: 'smooth' });
                  }
                }}
              >
>>>>>>> 0ad31427903353d31e593ac7cb04fc5403870e20
                Kontakt
              </Link>
              <div className="pt-2 border-t border-border">
                <Link href="/customer" className="flex items-center justify-center space-x-2 px-3 py-2 text-primary hover:text-primary/80 font-medium border border-primary rounded-md hover:bg-primary/5" onClick={closeMenu}>
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