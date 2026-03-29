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
    <footer className="bg-base-200 text-base-content">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              <Image
                src="/images/app-icon.png"
                alt="DualTemp Weather"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="text-lg font-bold">DualTemp Weather</span>
            </div>
            <p className="text-sm text-base-content/60 max-w-xs text-center md:text-left">
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
                className="link link-hover text-sm"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="divider my-6" />

        <p className="text-center text-sm text-base-content/50">{copyrightText}</p>
      </div>
    </footer>
  );
}
