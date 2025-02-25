import { SalesTheatre, Region, Country } from '@prisma/client';
import { cn } from '@/lib/utils/cn';

interface LocationDisplayProps {
  salesTheatre?: SalesTheatre;
  region?: Region;
  country?: Country;
  compact?: boolean;
  className?: string;
}

export function LocationDisplay({
  salesTheatre,
  region,
  country,
  compact = false,
  className,
}: LocationDisplayProps) {
  if (!salesTheatre && !region && !country) {
    return null;
  }

  const formatSalesTheatre = (theatre: SalesTheatre) => {
    switch (theatre) {
      case 'NORTH_AMERICA':
        return 'North America';
      case 'LAC':
        return 'Latin America & Caribbean';
      case 'EMEA':
        return 'EMEA';
      case 'APJ':
        return 'APJ';
      default:
        return theatre;
    }
  };

  if (compact) {
    const parts = [];
    if (country) parts.push(country.name);
    else if (region) parts.push(region.name);
    else if (salesTheatre) parts.push(formatSalesTheatre(salesTheatre));
    
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        {parts.join(' • ')}
      </span>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {salesTheatre && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Theatre:</span>
          <span className="text-sm text-muted-foreground">
            {formatSalesTheatre(salesTheatre)}
          </span>
        </div>
      )}
      {region && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Region:</span>
          <span className="text-sm text-muted-foreground">
            {region.name}
          </span>
        </div>
      )}
      {country && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Country:</span>
          <span className="text-sm text-muted-foreground">
            {country.name}
          </span>
        </div>
      )}
    </div>
  );
}
