import Image from 'next/image';
import StoreBadges from './StoreBadges';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  copyrightText: string;
  links: FooterLink[];
}

export default function Footer({ copyrightText, links }: FooterProps) {
  return (
    <footer className="bg-[#080b14] border-t border-white/[0.06]">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              <Image
                src="/images/app-icon.png"
                alt="DualTemp Weather"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="text-lg font-bold text-white tracking-tight">DualTemp Weather</span>
            </div>
            <p className="text-sm text-white/40 max-w-xs text-center md:text-left">
              Your weather, your way. Available on iOS, Android, and the web.
            </p>
            <StoreBadges />
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-6 justify-center">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/[0.06] my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">{copyrightText}</p>
          <div className="flex items-center gap-2">
            <Image
              src="/images/app-icon.png"
              alt="DualTemp Weather"
              width={20}
              height={20}
              className="rounded opacity-50"
            />
            <span className="text-xs text-white/30">DualTemp Weather</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
