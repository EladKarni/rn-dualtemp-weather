interface PlaceholderImageProps {
  label: string;
  width?: number;
  height?: number;
}

export default function PlaceholderImage({
  label,
  width = 280,
  height = 560,
}: PlaceholderImageProps) {
  return (
    <div
      className="rounded-[2rem] border-2 border-dashed border-base-content/20 bg-base-200/50 flex flex-col items-center justify-center gap-3"
      style={{ width, height }}
    >
      <svg
        className="w-10 h-10 text-base-content/30"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
        />
      </svg>
      <span className="text-sm text-base-content/40 font-medium text-center px-4">{label}</span>
    </div>
  );
}
