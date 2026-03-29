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
    <div className="card bg-base-100/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="card-body gap-3">
        <StarRating rating={rating} />
        <p className="text-base-content/80 leading-relaxed italic">&ldquo;{text}&rdquo;</p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-base-content/10">
          <div>
            <p className="font-medium text-sm">{author}</p>
            <p className="text-xs text-base-content/50">{date}</p>
          </div>
          <span className="badge badge-sm badge-outline">{source}</span>
        </div>
      </div>
    </div>
  );
}
