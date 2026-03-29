import Image from 'next/image';
import PlaceholderImage from '@/components/PlaceholderImage';

interface Screenshot {
  alt: string;
}

interface Widget {
  src: string;
  alt: string;
  label: string;
}

const screenshots: Screenshot[] = [
  { alt: 'Main weather view' },
  { alt: 'Settings screen' },
  { alt: 'Hourly forecast' },
  { alt: 'Location management' },
];

const widgets: Widget[] = [
  { src: '/images/widget-compact.png', alt: 'Compact widget', label: 'Compact (1x1)' },
  { src: '/images/widget-standard.png', alt: 'Standard widget', label: 'Standard (1x2)' },
  { src: '/images/widget-extended.png', alt: 'Extended widget', label: 'Extended (3x1)' },
];

export default function ScreenshotsSection() {
  return (
    <section id="screenshots" className="py-24 px-4 bg-base-200">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold text-center mb-4">See It in Action</h2>
        <div className="divider mb-12 max-w-xs mx-auto" />

        {/* Screenshot carousel */}
        <div className="flex gap-8 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide justify-start lg:justify-center">
          {screenshots.map((screenshot, index) => (
            <div key={index} className="snap-center flex-shrink-0">
              <div className="relative rounded-[2.5rem] border-4 border-base-content/20 bg-base-300 p-2 shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-base-content/20 rounded-b-xl z-10" />
                <PlaceholderImage label={screenshot.alt} />
              </div>
            </div>
          ))}
        </div>

        {/* Widgets section */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-2">Home Screen Widgets</h3>
          <p className="text-center text-base-content/60 mb-10">
            Check the weather without even opening the app
          </p>
          <div className="flex flex-wrap gap-8 justify-center items-end">
            {widgets.map((widget, index) => (
              <div key={index} className="flex flex-col items-center gap-3">
                <div className="card bg-base-100/60 shadow-lg p-4 rounded-2xl">
                  <Image
                    src={widget.src}
                    alt={widget.alt}
                    width={200}
                    height={200}
                    className="rounded-xl object-contain"
                  />
                </div>
                <span className="text-sm font-medium text-base-content/60">{widget.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
