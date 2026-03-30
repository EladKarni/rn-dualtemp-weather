'use client';

import ScrollReveal from '@/components/motion/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerChildren';

const designCards = [
  {
    title: 'Minimalist Icons',
    content: 'icons',
  },
  {
    title: 'Dynamic Gradients',
    content: 'gradients',
  },
  {
    title: 'Elegant Typography',
    content: 'typography',
  },
  {
    title: 'Smooth Transitions',
    content: 'transitions',
  },
];

function WeatherIcons() {
  const icons = [
    // Sun
    { label: 'Sun', path: 'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z' },
    // Cloud
    { label: 'Cloud', path: 'M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z' },
    // Rain
    { label: 'Rain', path: 'M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z' },
    // Moon
    { label: 'Moon', path: 'M9.37 5.51A7.35 7.35 0 009.1 7.5c0 4.08 3.32 7.4 7.4 7.4.68 0 1.35-.09 1.99-.27A7.014 7.014 0 0112 19c-3.86 0-7-3.14-7-7 0-2.93 1.81-5.45 4.37-6.49z' },
    // Thermometer
    { label: 'Temperature', path: 'M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-1v1h1v2h-1v1h1v2h-2V5z' },
    // Wind
    { label: 'Wind', path: 'M14.5 17c0 1.65-1.35 3-3 3s-3-1.35-3-3h2c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1H2v-2h9.5c1.65 0 3 1.35 3 3zM19 6.5C19 4.57 17.43 3 15.5 3S12 4.57 12 6.5h2c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S16.33 8 15.5 8H2v2h13.5c1.93 0 3.5-1.57 3.5-3.5zM18.5 11H2v2h16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5H15c0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5z' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 p-2">
      {icons.map((icon) => (
        <div key={icon.label} className="flex items-center justify-center p-3 rounded-xl bg-white/[0.03]">
          <svg className="w-6 h-6 text-white/70" viewBox="0 0 24 24" fill="currentColor">
            <path d={icon.path} />
          </svg>
        </div>
      ))}
    </div>
  );
}

function GradientSwatches() {
  const gradients = [
    { gradient: 'bg-gradient-to-br from-sky-400 to-blue-600', label: 'Clear sky' },
    { gradient: 'bg-gradient-to-br from-orange-400 to-rose-600', label: 'Sunset' },
    { gradient: 'bg-gradient-to-br from-dualtemp-700 to-dualtemp-400', label: 'Night' },
    { gradient: 'bg-gradient-to-br from-slate-500 to-slate-700', label: 'Overcast' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-2">
      {gradients.map((item, i) => (
        <div key={i} className={`aspect-square rounded-xl ${item.gradient}`} title={item.label} />
      ))}
    </div>
  );
}

function TypographyShowcase() {
  return (
    <div className="flex flex-col gap-3 p-4 justify-center">
      <div className="space-y-2">
        <p className="text-xs text-white/40 uppercase tracking-wider">Display</p>
        <p className="text-2xl font-serif text-white/90">DM Serif</p>
        <p className="text-xs text-white/40 uppercase tracking-wider mt-3">Body</p>
        <p className="text-base text-white/70">DM Sans</p>
        <p className="text-xs text-white/40 mt-2">Clean. Readable. Elegant.</p>
      </div>
    </div>
  );
}

function TransitionArrow() {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="relative">
        <svg className="w-16 h-16 text-dualtemp-500" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 32h32M36 20l12 12-12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="absolute inset-0 bg-dualtemp-500/20 blur-xl rounded-full" />
      </div>
    </div>
  );
}

const cardContents: Record<string, React.ReactNode> = {
  icons: <WeatherIcons />,
  gradients: <GradientSwatches />,
  typography: <TypographyShowcase />,
  transitions: <TransitionArrow />,
};

export default function DesignSection() {
  return (
    <section id="design" className="py-24 px-4 bg-[#0d1120]">
      <div className="container mx-auto max-w-6xl">
        <ScrollReveal>
          <p className="text-sm tracking-[0.2em] text-dualtemp-400 uppercase mb-3 text-center font-medium">
            Design
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-white text-center mb-4">
            Crafted with Care
          </h2>
          <p className="text-white/50 text-center mb-16 max-w-lg mx-auto">
            Every detail — from weather-adaptive gradients to clean typography — is designed to make checking the forecast a pleasure.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {designCards.map((card) => (
            <StaggerItem key={card.title}>
              <div className="glass-card p-4 h-full">
                <div className="min-h-[140px]">
                  {cardContents[card.content]}
                </div>
                <p className="text-xs text-white/50 text-center mt-3 tracking-wide">{card.title}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Gradient color bar */}
        <ScrollReveal delay={0.3}>
          <div className="h-2 rounded-full overflow-hidden flex">
            <div className="flex-1 bg-gradient-to-r from-cyan-400 to-dualtemp-500" />
            <div className="flex-1 bg-gradient-to-r from-dualtemp-500 to-pink-500" />
            <div className="flex-1 bg-gradient-to-r from-pink-500 to-rose-400" />
            <div className="flex-1 bg-gradient-to-r from-rose-400 to-dualtemp-300" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
