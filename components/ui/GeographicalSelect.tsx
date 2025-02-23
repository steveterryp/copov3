import { useRegions, useCountriesByRegion } from '@/lib/hooks/useGeographical';
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
  // Fetch data
  const { data: regions, isLoading: regionsLoading } = useRegions();
  const { data: countries, isLoading: countriesLoading } = useCountriesByRegion(selectedRegion);

  // Handle changes
  const handleTheatreChange = (theatre: SalesTheatre) => {
    onChange({ 
      theatre,
      regionId: undefined,
      countryId: undefined
    });
  };

  const handleRegionChange = (regionId: string) => {
    onChange({
      theatre: selectedTheatre,
      regionId,
      countryId: undefined
    });
  };

  const handleCountryChange = (countryId: string) => {
    onChange({
      theatre: selectedTheatre,
      regionId: selectedRegion,
      countryId
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
                {theatre}
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
          disabled={disabled || regionsLoading || !regions?.length}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {regions?.map((region) => (
              <SelectItem key={region.id} value={region.id}>
                {region.name}
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
          disabled={disabled || countriesLoading || !selectedRegion || !countries?.length}
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
    </div>
  );
}
