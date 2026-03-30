'use client';

import Image from 'next/image';
import ScrollReveal from '@/components/motion/ScrollReveal';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaButtons?: { text: string; href: string; variant: string }[];
}

export default function HeroSection({ title, subtitle }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0b0f1a]">
      {/* Background cityscape image */}
      <Image
        src="/images/hero-cityscape.jpg"
        alt="City skyline with overcast sky"
        fill
        priority
        className="object-cover object-bottom"
      />

      {/* Dark overlay for text readability - lighter to let image show */}
      <div className="absolute inset-0 bg-[#0b0f1a]/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f1a]/60 via-transparent to-[#0b0f1a]/80" />

      {/* Content */}
      <div className="relative z-10 container mx-auto max-w-4xl px-4 text-center">
        <ScrollReveal delay={0.1}>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.1] mb-6 tracking-tight max-w-3xl mx-auto">
            {title}
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={0.25}>
          <p className="text-base sm:text-lg text-white/60 mb-10 leading-relaxed max-w-xl mx-auto">
            {subtitle}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <a
            href="#features"
            className="inline-flex items-center px-8 py-3.5 text-sm text-white/90 border border-white/25 rounded-full hover:bg-white/10 hover:border-white/40 transition-all duration-300 tracking-wide backdrop-blur-sm"
          >
            Explore the App
          </a>
        </ScrollReveal>
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0b0f1a] to-transparent z-[5]" />
    </section>
  );
}
