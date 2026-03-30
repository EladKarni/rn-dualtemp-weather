'use client';

import PhoneMockup from '@/components/PhoneMockup';
import ScrollReveal from '@/components/motion/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerChildren';

interface Story {
  number: string;
  title: string;
  description: string;
  screenshot: string;
  city?: string;
  temp?: string;
  secondaryTemp?: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  title: string;
  stories: Story[];
  features: Feature[];
}

export default function FeaturesSection({ title, stories, features }: FeaturesSectionProps) {
  return (
    <section id="features">
      {/* Stories: alternating screenshot + text */}
      {stories.map((story, index) => {
        const isReversed = index % 2 !== 0;

        return (
          <div
            key={story.number}
            className={`min-h-[80vh] flex items-center py-20 px-4 ${
              index % 2 === 0 ? 'bg-[#0b0f1a]' : 'bg-[#0d1120]'
            }`}
          >
            <div className="container mx-auto max-w-6xl">
              <div
                className={`flex flex-col ${
                  isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'
                } items-center gap-12 lg:gap-20`}
              >
                {/* Text side */}
                <div className="flex-1 text-center lg:text-left">
                  <ScrollReveal direction={isReversed ? 'right' : 'left'}>
                    <span className="block font-serif text-[8rem] md:text-[10rem] leading-none text-white/[0.04] select-none -mb-12 md:-mb-16">
                      {story.number}
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-6">
                      {story.number}. {story.title}
                    </h2>
                    <p className="text-lg text-white/60 leading-relaxed max-w-md mx-auto lg:mx-0">
                      {story.description}
                    </p>
                  </ScrollReveal>
                </div>

                {/* Phone side */}
                <div className="flex-shrink-0">
                  <ScrollReveal direction="up" delay={0.2}>
                    <PhoneMockup
                      src={story.screenshot}
                      alt={`${story.title} screenshot`}
                      className="w-[260px] md:w-[300px]"
                      city={story.city}
                      temp={story.temp}
                      secondaryTemp={story.secondaryTemp}
                    />
                  </ScrollReveal>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Feature cards grid */}
      <div className="py-24 px-4 bg-[#0b0f1a]">
        <div className="container mx-auto max-w-6xl">
          <ScrollReveal>
            <h2 className="font-serif text-3xl md:text-4xl text-white text-center mb-4">
              {title}
            </h2>
            <div className="w-12 h-0.5 bg-dualtemp-500/50 mx-auto mb-12" />
          </ScrollReveal>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <StaggerItem key={index}>
                <div className="glass-card-hover p-6 flex flex-col items-center text-center gap-3">
                  <div className="text-4xl mb-2" aria-hidden="true">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
