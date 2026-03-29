import { cn } from '@/lib/utils';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  title: string;
  features: Feature[];
}

export default function FeaturesSection({ title, features }: FeaturesSectionProps) {
  return (
    <section id="features" className="py-24 px-4 bg-base-100">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold text-center mb-4">{title}</h2>
        <div className="divider mb-12 max-w-xs mx-auto" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                'card bg-base-200/60 backdrop-blur-sm shadow-lg',
                'hover:shadow-xl hover:-translate-y-1 transition-all duration-300'
              )}
            >
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-3" aria-hidden="true">
                  {feature.icon}
                </div>
                <h3 className="card-title text-lg">{feature.title}</h3>
                <p className="opacity-70 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
