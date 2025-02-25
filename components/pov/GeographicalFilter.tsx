'use client';

import React, { useState, useEffect } from 'react';
import { SalesTheatre } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Globe, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface Region {
  id: string;
  name: string;
  type?: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
  theatre?: SalesTheatre;
  regions?: Region[];
}

interface GeographicalFilterProps {
  onFilterChange: (filters: {
    salesTheatre?: SalesTheatre;
    regionId?: string;
    countryId?: string;
  }) => void;
  className?: string;
}

export function GeographicalFilter({ onFilterChange, className }: GeographicalFilterProps) {
  const [selectedTheatre, setSelectedTheatre] = useState<SalesTheatre | undefined>(undefined);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(undefined);
  const [selectedRegion, setSelectedRegion] = useState<Region | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>('theatre');

  // Mock data for fallback
  const mockCountries: Country[] = [
    { id: 'country1', name: 'United States', code: 'US' },
    { id: 'country2', name: 'United Kingdom', code: 'UK' },
    { id: 'country3', name: 'Australia', code: 'AU' },
    { id: 'country4', name: 'Brazil', code: 'BR' },
  ];

  // Fetch all countries
  const { data: allCountries = [] } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/geographical/countries');
        if (!response.ok) {
          console.warn('Failed to fetch countries, using mock data');
          return mockCountries;
        }
        return response.json();
      } catch (error) {
        console.warn('Error fetching countries:', error);
        return mockCountries;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch countries by theatre
  const { data: theatreCountries = [], isLoading: theatreCountriesLoading } = useQuery<Country[]>({
    queryKey: ['countries', 'theatre', selectedTheatre],
    queryFn: async () => {
      if (!selectedTheatre) return [];
      try {
        const response = await fetch(`/api/geographical/theatre/${selectedTheatre}/countries`);
        if (!response.ok) {
          console.warn('Failed to fetch countries by theatre');
          // Filter mock countries by theatre as fallback
          return mockCountries.filter(c => c.theatre === selectedTheatre);
        }
        return response.json();
      } catch (error) {
        console.warn('Error fetching countries by theatre:', error);
        return [];
      }
    },
    enabled: !!selectedTheatre,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch regions by country
  const { data: countryRegions = [], isLoading: regionsLoading } = useQuery<Region[]>({
    queryKey: ['regions', 'country', selectedCountry?.id],
    queryFn: async () => {
      if (!selectedCountry) return [];
      try {
        const response = await fetch(`/api/geographical/countries/${selectedCountry.id}/regions`);
        if (!response.ok) {
          console.warn('Failed to fetch regions by country');
          // Use regions from the country object if available
          return selectedCountry.regions || [];
        }
        return response.json();
      } catch (error) {
        console.warn('Error fetching regions by country:', error);
        return selectedCountry.regions || [];
      }
    },
    enabled: !!selectedCountry,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update filters when selections change
  useEffect(() => {
    onFilterChange({
      salesTheatre: selectedTheatre,
      countryId: selectedCountry?.id,
      regionId: selectedRegion?.id,
    });
  }, [selectedTheatre, selectedCountry, selectedRegion, onFilterChange]);

  // Reset dependent filters when parent filter changes
  useEffect(() => {
    if (!selectedTheatre) {
      setSelectedCountry(undefined);
      setSelectedRegion(undefined);
    }
  }, [selectedTheatre]);

  useEffect(() => {
    setSelectedRegion(undefined);
  }, [selectedCountry]);

  // Format theatre name for display
  const formatTheatreName = (theatre: SalesTheatre) => {
    switch (theatre) {
      case 'NORTH_AMERICA':
        return 'North America';
      case 'LAC':
        return 'Latin America & Caribbean';
      case 'EMEA':
        return 'Europe, Middle East & Africa';
      case 'APJ':
        return 'Asia Pacific & Japan';
      default:
        return String(theatre).replace('_', ' ');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTheatre(undefined);
    setSelectedCountry(undefined);
    setSelectedRegion(undefined);
    onFilterChange({});
  };

  // Get active filters count
  const activeFiltersCount = [
    selectedTheatre,
    selectedCountry,
    selectedRegion,
  ].filter(Boolean).length;

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Geographical Filters</CardTitle>
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-8 gap-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear all</span>
            </Button>
          )}
        </div>
        <CardDescription>
          Filter POVs by geographical location
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="theatre">By Theatre</TabsTrigger>
            <TabsTrigger value="country">By Country</TabsTrigger>
          </TabsList>
          
          <TabsContent value="theatre" className="space-y-4 pt-4">
            {/* Theatre Selector */}
            <div className="space-y-1.5">
              <div className="text-sm font-medium">Sales Theatre</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedTheatre ? formatTheatreName(selectedTheatre) : "Select theatre"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search theatre..." />
                    <CommandEmpty>No theatre found.</CommandEmpty>
                    <CommandGroup>
                      {Object.values(SalesTheatre).map((theatre) => (
                        <CommandItem
                          key={theatre}
                          value={theatre}
                          onSelect={() => {
                            setSelectedTheatre(theatre as SalesTheatre);
                            setActiveTab('theatre');
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedTheatre === theatre ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {formatTheatreName(theatre)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Countries by Theatre */}
            {selectedTheatre && (
              <div className="space-y-1.5">
                <div className="text-sm font-medium">Country</div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      disabled={theatreCountriesLoading || (theatreCountries as Country[]).length === 0}
                    >
                      {selectedCountry ? selectedCountry.name : "Select country"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search country..." />
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {(theatreCountries as Country[]).map((country: Country) => (
                          <CommandItem
                            key={country.id}
                            value={country.name}
                            onSelect={() => {
                              setSelectedCountry(country);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCountry?.id === country.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {country.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Regions by Country */}
            {selectedCountry && (
              <div className="space-y-1.5">
                <div className="text-sm font-medium">Region</div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      disabled={regionsLoading || (countryRegions as Region[]).length === 0}
                    >
                      {selectedRegion ? selectedRegion.name : "Select region"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search region..." />
                      <CommandEmpty>No region found.</CommandEmpty>
                      <CommandGroup>
                        {(countryRegions as Region[]).map((region: Region) => (
                          <CommandItem
                            key={region.id}
                            value={region.name}
                            onSelect={() => {
                              setSelectedRegion(region);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedRegion?.id === region.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {region.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="country" className="space-y-4 pt-4">
            {/* Country Selector */}
            <div className="space-y-1.5">
              <div className="text-sm font-medium">Country</div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedCountry ? selectedCountry.name : "Select country"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {(allCountries as Country[]).map((country: Country) => (
                        <CommandItem
                          key={country.id}
                          value={country.name}
                          onSelect={() => {
                            setSelectedCountry(country);
                            setSelectedTheatre(country.theatre);
                            setActiveTab('country');
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCountry?.id === country.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {country.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Regions by Country */}
            {selectedCountry && (
              <div className="space-y-1.5">
                <div className="text-sm font-medium">Region</div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      disabled={regionsLoading || (countryRegions as Region[]).length === 0}
                    >
                      {selectedRegion ? selectedRegion.name : "Select region"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search region..." />
                      <CommandEmpty>No region found.</CommandEmpty>
                      <CommandGroup>
                        {(countryRegions as Region[]).map((region: Region) => (
                          <CommandItem
                            key={region.id}
                            value={region.name}
                            onSelect={() => {
                              setSelectedRegion(region);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedRegion?.id === region.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {region.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-medium mb-2">Active Filters</div>
            <div className="flex flex-wrap gap-2">
              {selectedTheatre && (
                <Badge variant="secondary" className="gap-1 pl-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  <span>{formatTheatreName(selectedTheatre)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => setSelectedTheatre(undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {selectedCountry && (
                <Badge variant="secondary" className="gap-1 pl-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{selectedCountry.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => setSelectedCountry(undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {selectedRegion && (
                <Badge variant="secondary" className="gap-1 pl-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{selectedRegion.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => setSelectedRegion(undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
