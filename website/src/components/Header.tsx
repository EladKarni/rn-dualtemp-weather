'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  logo: string;
  navItems: NavItem[];
}

export default function Header({ navItems }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#0b0f1a]/80 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto max-w-6xl px-4">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <Image
              src="/images/app-icon.png"
              alt="DualTemp Weather"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-lg font-bold text-white tracking-tight">DualTemp Weather</span>
          </a>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <a
            href="#download"
            className="hidden lg:inline-flex items-center px-5 py-2 text-sm text-white/90 border border-white/20 rounded-full hover:bg-white/10 hover:border-white/30 transition-all duration-300"
          >
            Download
          </a>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
              )}
            </svg>
          </button>
        </nav>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0b0f1a]/95 backdrop-blur-xl border-t border-white/[0.06]">
          <div className="container mx-auto max-w-6xl px-4 py-6">
            <ul className="flex flex-col gap-4">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-lg text-white/70 hover:text-white transition-colors py-2"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <a
                  href="#download"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center px-6 py-2.5 text-sm text-white border border-white/20 rounded-full hover:bg-white/10 transition-all"
                >
                  Download
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
