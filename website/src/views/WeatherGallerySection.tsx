'use client';

import Image from 'next/image';
import ScrollReveal from '@/components/motion/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerChildren';

const weatherConditions = [
  { label: 'Widget designs', gradient: 'from-dualtemp-700 via-dualtemp-500 to-cyan-500', hasWidget: true },
  { label: 'Sunset', gradient: 'from-orange-500 via-rose-500 to-purple-600' },
  { label: 'Storm', gradient: 'from-slate-700 via-slate-600 to-slate-800' },
  { label: 'Sunshine', gradient: 'from-sky-400 via-blue-400 to-blue-500' },
  { label: 'Rain', gradient: 'from-slate-500 via-slate-600 to-blue-700' },
  { label: 'Snow', gradient: 'from-blue-200 via-slate-300 to-blue-300' },
  { label: 'Cloud', gradient: 'from-slate-400 via-slate-500 to-slate-600' },
];

const weatherIcons: Record<string, string> = {
  'Widget designs': '📱',
  Sunset: '🌅',
  Storm: '⛈️',
  Sunshine: '☀️',
  Rain: '🌧️',
  Snow: '❄️',
  Cloud: '☁️',
};

const widgets = [
  { src: '/images/widget-compact.png', alt: 'Compact widget', label: 'Compact (1x1)' },
  { src: '/images/widget-standard.png', alt: 'Standard widget', label: 'Standard (1x2)' },
  { src: '/images/widget-extended.png', alt: 'Extended widget', label: 'Extended (3x1)' },
];

export default function WeatherGallerySection() {
  return (
    <section id="screenshots" className="py-24 px-4 bg-[#0b0f1a]">
      <div className="container mx-auto max-w-6xl">
        <ScrollReveal>
          <h2 className="font-serif text-3xl md:text-4xl text-white text-center mb-4">
            Visual Aesthetics that move with the weather.
          </h2>
          <p className="text-white/50 text-center mb-16 max-w-xl mx-auto">
            The app adapts its gradients and colors to match real-time conditions — clear skies, storms, snow, and everything in between.
          </p>
        </ScrollReveal>

        {/* Weather condition cards */}
        <StaggerContainer className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 mb-20">
          {weatherConditions.map((condition) => (
            <StaggerItem key={condition.label}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`aspect-[3/4] w-full rounded-2xl bg-gradient-to-b ${condition.gradient} flex items-center justify-center shadow-lg overflow-hidden`}
                >
                  {condition.hasWidget ? (
                    <div className="text-center p-2">
                      <p className="text-white text-[10px] font-medium opacity-80">62°F</p>
                      <p className="text-white/60 text-[8px]">54° / 58°</p>
                    </div>
                  ) : (
                    <span className="text-2xl md:text-3xl">{weatherIcons[condition.label]}</span>
                  )}
                </div>
                <span className="text-xs text-white/40">{condition.label}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Weather icon row */}
        <ScrollReveal>
          <div className="flex flex-wrap gap-8 justify-center items-center mb-20">
            {['Sun', 'Rain', 'Snow', 'Cloud', 'Storm', 'Sunshine'].map((name) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {name === 'Sun' && <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>}
                    {name === 'Rain' && <><line x1="16" y1="13" x2="16" y2="21" /><line x1="8" y1="13" x2="8" y2="21" /><line x1="12" y1="15" x2="12" y2="23" /><path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25" /></>}
                    {name === 'Snow' && <><path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25" /><line x1="8" y1="16" x2="8.01" y2="16" /><line x1="8" y1="20" x2="8.01" y2="20" /><line x1="12" y1="18" x2="12.01" y2="18" /><line x1="12" y1="22" x2="12.01" y2="22" /><line x1="16" y1="16" x2="16.01" y2="16" /><line x1="16" y1="20" x2="16.01" y2="20" /></>}
                    {name === 'Cloud' && <><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" /></>}
                    {name === 'Storm' && <><path d="M19 16.9A5 5 0 0018 7h-1.26a8 8 0 10-11.62 9" /><polyline points="13 11 9 17 15 17 11 23" /></>}
                    {name === 'Sunshine' && <><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></>}
                  </svg>
                </div>
                <span className="text-xs text-white/30">{name}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Widgets section */}
        <ScrollReveal>
          <h3 className="font-serif text-2xl text-white text-center mb-2">Home Screen Widgets</h3>
          <p className="text-center text-white/40 mb-10">
            Three sizes — Compact, Standard, and Extended — updated every 30 minutes so you never have to open the app.
          </p>
        </ScrollReveal>
        <StaggerContainer className="flex flex-wrap gap-8 justify-center items-end">
          {widgets.map((widget) => (
            <StaggerItem key={widget.label}>
              <div className="flex flex-col items-center gap-3">
                <div className="glass-card p-4">
                  <Image
                    src={widget.src}
                    alt={widget.alt}
                    width={200}
                    height={200}
                    className="rounded-xl object-contain"
                  />
                </div>
                <span className="text-sm font-medium text-white/40">{widget.label}</span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
