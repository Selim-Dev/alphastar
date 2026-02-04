import { MapPin } from 'lucide-react';

interface LocationDisplayProps {
  location: string | null | undefined;
  showIcon?: boolean;
}

export function LocationDisplay({ location, showIcon = true }: LocationDisplayProps) {
  if (!location) {
    return (
      <span className="text-muted-foreground text-xs italic">
        N/A
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      {showIcon && <MapPin className="w-3.5 h-3.5 text-muted-foreground" />}
      <span className="text-foreground font-medium text-sm">
        {location}
      </span>
    </div>
  );
}
