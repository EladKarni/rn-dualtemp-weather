import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { DM_Sans } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://dualtemp-weather.netlify.app'),
  title: 'DualTemp Weather — Your Weather, Your Way',
  description:
    'Real-time weather with dual temperature units, multi-location tracking, and beautiful home screen widgets. Available on iOS, Android, and the web.',
  keywords: [
    'weather app',
    'forecast',
    'temperature',
    'widgets',
    'iOS',
    'Android',
    'multi-location',
    'DualTemp',
  ],
  openGraph: {
    title: 'DualTemp Weather — Your Weather, Your Way',
    description:
      'Real-time weather with dual temperature units, multi-location tracking, and beautiful home screen widgets.',
    type: 'website',
    images: ['/images/screenshot-main.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DualTemp Weather — Your Weather, Your Way',
    description:
      'Real-time weather with dual temperature units, multi-location tracking, and beautiful home screen widgets.',
    images: ['/images/screenshot-main.png'],
  },
};

function getSiteConfig() {
  const filePath = path.join(process.cwd(), 'content', 'site-config.md');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(fileContents);
  return data;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteConfig = getSiteConfig();

  return (
    <html lang="en" data-theme="light" className={`${dmSans.variable}`}>
      <body className="min-h-screen flex flex-col font-[family-name:var(--font-dm-sans)]">
        <Header logo={siteConfig.siteName} navItems={siteConfig.navItems} />
        <main className="flex-1">{children}</main>
        <Footer copyrightText={siteConfig.copyrightText} links={siteConfig.footerLinks} />
      </body>
    </html>
  );
}
