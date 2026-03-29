import Image from 'next/image';
import StoreBadges from '@/components/StoreBadges';

interface CtaButton {
  text: string;
  href: string;
  variant: 'primary' | 'secondary' | 'outline';
}

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaButtons: CtaButton[];
}

export default function HeroSection({ title, subtitle }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-primary via-secondary to-accent overflow-hidden flex items-center">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-24 lg:py-32 relative z-10 text-center">
        <Image
          src="/images/app-icon.png"
          alt="DualTemp Weather icon"
          width={96}
          height={96}
          className="rounded-3xl shadow-2xl mx-auto mb-8"
          priority
        />

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
          {title}
        </h1>

        <p className="text-lg sm:text-xl text-white/80 mb-10 leading-relaxed max-w-2xl mx-auto">
          {subtitle}
        </p>

        <div className="flex justify-center mb-6">
          <StoreBadges size="large" />
        </div>

        <a
          href="https://dualtemp-weather.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-white/70 hover:text-white transition-colors text-sm underline underline-offset-4"
        >
          Or try the web demo
        </a>
      </div>
    </section>
  );
}
