import Image from 'next/image';

interface PhoneMockupProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  city?: string;
  temp?: string;
  secondaryTemp?: string;
}

function PlaceholderScreen({ city, temp, secondaryTemp }: { city?: string; temp?: string; secondaryTemp?: string }) {
  return (
    <div className="aspect-[9/19.5] w-full bg-gradient-to-b from-dualtemp-900 via-dualtemp-700 to-dualtemp-950 flex flex-col items-center justify-center p-6">
      <p className="text-white/60 text-xs mb-1 tracking-wider">{city || 'City'}</p>
      <p className="text-white text-4xl font-bold">{temp || '72°F'}</p>
      <p className="text-white/50 text-sm mt-1">{secondaryTemp || '22°C'}</p>
      <div className="flex gap-4 mt-8">
        {['☀️', '🌤️', '⛅', '🌧️'].map((icon, i) => (
          <span key={i} className="text-lg">{icon}</span>
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        {['Hourly', 'Daily', 'Sunrise', 'Sunset'].map((label) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg bg-white/10" />
            <span className="text-[8px] text-white/30">{label}</span>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-white/20 mt-6">Current / Forecast</p>
    </div>
  );
}

export default function PhoneMockup({ src, alt, className = '', priority = false, city, temp, secondaryTemp }: PhoneMockupProps) {
  const isPlaceholder = !src || src.includes('placeholder');

  return (
    <div className={`relative ${className}`}>
      {/* Phone frame */}
      <div className="relative bg-black rounded-[2.8rem] p-[6px] shadow-2xl shadow-dualtemp-500/10">
        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-full z-20" />

        {/* Screen */}
        <div className="relative rounded-[2.5rem] overflow-hidden bg-dualtemp-950">
          {isPlaceholder ? (
            <PlaceholderScreen city={city} temp={temp} secondaryTemp={secondaryTemp} />
          ) : (
            <Image
              src={src}
              alt={alt}
              width={280}
              height={600}
              className="w-full h-auto object-cover"
              priority={priority}
            />
          )}
        </div>
      </div>
    </div>
  );
}
