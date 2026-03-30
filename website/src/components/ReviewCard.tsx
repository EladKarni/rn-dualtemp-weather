import StarRating from './StarRating';

interface ReviewCardProps {
  author: string;
  rating: number;
  text: string;
  source: 'App Store' | 'Google Play';
  date: string;
}

export default function ReviewCard({ author, rating, text, source, date }: ReviewCardProps) {
  return (
    <div className="glass-card-hover p-6 flex flex-col gap-3">
      <StarRating rating={rating} />
      <p className="text-white/70 leading-relaxed italic text-sm">&ldquo;{text}&rdquo;</p>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
        <div>
          <p className="font-medium text-sm text-white/90">{author}</p>
          <p className="text-xs text-white/40">{date}</p>
        </div>
        <span className="text-xs text-dualtemp-400 border border-dualtemp-400/30 rounded-full px-2.5 py-0.5">
          {source}
        </span>
      </div>
    </div>
  );
}
