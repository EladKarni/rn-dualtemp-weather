'use client';

import ReviewCard from '@/components/ReviewCard';
import ScrollReveal from '@/components/motion/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/StaggerChildren';

const reviews = [
  {
    author: 'Paula Poblete',
    rating: 5 as const,
    text: 'Perfect to share with friends and family. I live in the US but have family and friends in countries where the temp is in Centigrades. This app is accurate and shows temperatures in C and F at the same time without clutter. It has the hourly forecast for the day, including rain.',
    source: 'Google Play' as const,
    date: 'January 2026',
  },
  {
    author: 'Qurigo',
    rating: 5 as const,
    text: 'This is what I am looking for!!! Great to see both C and F at the same time since other apps don\'t support. Thank you developer!',
    source: 'App Store' as const,
    date: 'September 2024',
  },
  {
    author: 'Lisa Brown',
    rating: 5 as const,
    text: "I wasn't optimistic that I'd even find a dual scale app, let alone one that was free, no ads, and open source. I live in the US, my family are in Canada, and when Dad asks, \"Is it cold there?\" he's not asking for yes or no, so I have to calculate. Well, I did...now I don't!",
    source: 'Google Play' as const,
    date: 'January 2025',
  },
  {
    author: 'Chris Casey',
    rating: 5 as const,
    text: "I just installed this and so far no ads or any annoying things, and it's very clean easy UI, with Celsius and Fahrenheit, exactly what I've been looking for, far better than the other apps I've tried.",
    source: 'Google Play' as const,
    date: 'December 2025',
  },
  {
    author: 'Dorkhorse',
    rating: 5 as const,
    text: 'I love that this is ad free and respects privacy. Use this app if you and your partner/roommate have different references for temp (Celsius v Fahrenheit).',
    source: 'App Store' as const,
    date: 'April 2023',
  },
  {
    author: 'Tomas C',
    rating: 5 as const,
    text: 'I appreciate the dual temperature display. This seamlessly immerses me in the foreign language of the Celsius temps used by the rest of the entire world. No more conversions! Also, the daily temperature graphs are very nicely laid out.',
    source: 'Google Play' as const,
    date: 'July 2024',
  },
];

export default function ReviewsSection() {
  return (
    <section id="reviews" className="py-24 px-4 bg-[#0d1120]">
      <div className="container mx-auto max-w-6xl">
        <ScrollReveal>
          <h2 className="font-serif text-3xl md:text-4xl text-white text-center mb-4">
            What People Are Saying
          </h2>
          <div className="w-12 h-0.5 bg-dualtemp-500/50 mx-auto mb-12" />
        </ScrollReveal>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review, index) => (
            <StaggerItem key={index}>
              <ReviewCard {...review} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
