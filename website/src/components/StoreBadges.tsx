import Image from 'next/image';

interface StoreBadgesProps {
  size?: 'default' | 'large';
}

export default function StoreBadges({ size = 'default' }: StoreBadgesProps) {
  const height = size === 'large' ? 56 : 44;
  const appStoreWidth = size === 'large' ? 168 : 132;
  const playStoreWidth = size === 'large' ? 188 : 148;

  return (
    <div className="flex gap-4 flex-wrap items-center">
      <a
        href="https://apps.apple.com/app/id1665040449?platform=iphone"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
      >
        <Image
          src="/images/app-store-badge.svg"
          alt="Download on the App Store"
          width={appStoreWidth}
          height={height}
        />
      </a>
      <a
        href="https://play.google.com/store/apps/details?id=com.ekarni.rndualtempweatherapp&hl=en_US&gl=US"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
      >
        <Image
          src="/images/google-play-badge.png"
          alt="Get it on Google Play"
          width={playStoreWidth}
          height={height}
        />
      </a>
    </div>
  );
}
