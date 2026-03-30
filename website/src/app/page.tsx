import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import HeroSection from '@/views/HeroSection';
import FeaturesSection from '@/views/FeaturesSection';
import DesignSection from '@/views/DesignSection';
import WeatherGallerySection from '@/views/WeatherGallerySection';
import ReviewsSection from '@/views/ReviewsSection';
import DownloadSection from '@/views/DownloadSection';

function getContent(filename: string) {
  const filePath = path.join(process.cwd(), 'content', filename);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(fileContents);
  return data;
}

export default function Home() {
  const heroData = getContent('sections/hero.md');
  const featuresData = getContent('sections/features.md');

  return (
    <>
      <HeroSection
        title={heroData.title}
        subtitle={heroData.subtitle}
        ctaButtons={heroData.ctaButtons}
      />
      <FeaturesSection title={featuresData.title} stories={featuresData.stories} features={featuresData.features} />
      <DesignSection />
      <WeatherGallerySection />
      <ReviewsSection />
      <DownloadSection />
    </>
  );
}
