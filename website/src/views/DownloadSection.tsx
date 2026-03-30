'use client';

import StoreBadges from '@/components/StoreBadges';
import ScrollReveal from '@/components/motion/ScrollReveal';

export default function DownloadSection() {
  return (
    <section id="download" className="py-28 px-4 bg-[#0b0f1a] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[300px] bg-dualtemp-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto max-w-2xl text-center relative z-10">
        <ScrollReveal>
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">
            Get DualTemp Weather
          </h2>
          <p className="text-lg text-white/50 mb-10 leading-relaxed">
            Download for free on iOS and Android. Start tracking weather across all your locations
            with beautiful widgets and dual temperature support.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="flex justify-center mb-8">
            <StoreBadges size="large" />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <a
            href="https://dualtemp-weather.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-white/40 hover:text-white/70 transition-colors text-sm underline underline-offset-4"
          >
            Or try the web demo in your browser
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}
