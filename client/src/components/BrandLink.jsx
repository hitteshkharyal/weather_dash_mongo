import { Link } from 'react-router-dom';
import { Cloud } from 'lucide-react';

export default function BrandLink({ compact = false }) {
  return (
    <Link
      to="/"
      aria-label="WeatherDash home"
      className="inline-flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      <Cloud aria-hidden="true" size={24} className="shrink-0 text-brand-400" />
      {!compact && (
        <span className="truncate text-lg font-display font-bold tracking-tight text-white">
          Weather<span className="text-brand-400">Dash</span>
        </span>
      )}
    </Link>
  );
}
