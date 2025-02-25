import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { SalesTheatre } from '@prisma/client';
import { Label } from '@/components/ui/Label';

interface GeographicalSelectProps {
  selectedTheatre?: SalesTheatre;
  selectedRegion?: string;
  selectedCountry?: string;
  onChange: (data: {
    theatre?: SalesTheatre;
    regionId?: string;
    countryId?: string;
  }) => void;
  disabled?: boolean;
}

export function GeographicalSelect({
  selectedTheatre,
  selectedRegion,
  selectedCountry,
  onChange,
  disabled = false,
}: GeographicalSelectProps) {
  // Fetch countries by theatre
  const { data: countries, isLoading: countriesLoading } = useQuery<{
    id: string;
    name: string;
    regions: { id: string; name: string }[];
  }[]>({
    queryKey: ['countries', selectedTheatre],
    queryFn: async () => {
      if (!selectedTheatre) return [];
      const response = await fetch(`/api/geographical/theatre/${selectedTheatre}/countries`);
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      return response.json();
    },
    enabled: !!selectedTheatre,
  });

  // Get regions for selected country
  const regions = selectedCountry 
    ? countries?.find(c => c.id === selectedCountry)?.regions || []
    : [];

  // Handle changes
  const handleTheatreChange = (theatre: SalesTheatre) => {
    onChange({ 
      theatre,
      countryId: undefined,
      regionId: undefined
    });
  };

  const handleCountryChange = (countryId: string) => {
    onChange({
      theatre: selectedTheatre,
      countryId,
      regionId: undefined
    });
  };

  const handleRegionChange = (regionId: string) => {
    onChange({
      theatre: selectedTheatre,
      countryId: selectedCountry,
      regionId
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Sales Theatre</Label>
        <Select
          value={selectedTheatre}
          onValueChange={handleTheatreChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select theatre" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(SalesTheatre).map((theatre) => (
              <SelectItem key={theatre} value={theatre}>
                {theatre.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Country</Label>
        <Select
          value={selectedCountry}
          onValueChange={handleCountryChange}
          disabled={disabled || countriesLoading || !selectedTheatre || !countries?.length}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries?.map((country) => (
              <SelectItem key={country.id} value={country.id}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Region</Label>
        <Select
          value={selectedRegion}
          onValueChange={handleRegionChange}
          disabled={disabled || !selectedCountry || !regions.length}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region.id} value={region.id}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
