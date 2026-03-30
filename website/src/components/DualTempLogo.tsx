interface DualTempLogoProps {
  className?: string;
}

export default function DualTempLogo({ className = 'w-8 h-8' }: DualTempLogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left thermometer (cool) */}
      <rect x="8" y="6" width="8" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="31" r="5" stroke="currentColor" strokeWidth="2" />
      <rect x="10.5" y="18" width="3" height="10" rx="1.5" fill="#60A5FA" />
      <circle cx="12" cy="31" r="3" fill="#60A5FA" />

      {/* Right thermometer (warm) */}
      <rect x="24" y="6" width="8" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="28" cy="31" r="5" stroke="currentColor" strokeWidth="2" />
      <rect x="26.5" y="12" width="3" height="16" rx="1.5" fill="#F87171" />
      <circle cx="28" cy="31" r="3" fill="#F87171" />
    </svg>
  );
}
