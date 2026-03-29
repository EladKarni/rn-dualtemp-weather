import StoreBadges from '@/components/StoreBadges';

export default function DownloadSection() {
  return (
    <section
      id="download"
      className="py-24 px-4 bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-20 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-white rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto max-w-2xl text-center relative z-10">
        <h2 className="text-4xl font-bold text-white mb-4">Get DualTemp Weather</h2>
        <p className="text-lg text-white/80 mb-10 leading-relaxed">
          Download for free on iOS and Android. Start tracking weather across all your locations
          with beautiful widgets and dual temperature support.
        </p>

        <div className="flex justify-center mb-8">
          <StoreBadges size="large" />
        </div>

        <a
          href="https://dualtemp-weather.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-white/70 hover:text-white transition-colors text-sm underline underline-offset-4"
        >
          Or try the web demo in your browser
        </a>
      </div>
    </section>
  );
}
