import { POV, SalesTheatre, Region, Country } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LocationDisplay } from '@/components/ui/LocationDisplay';
import { GeographicalSelect } from '@/components/ui/GeographicalSelect';

interface POVDetailsProps {
  pov: POV & {
    region?: Region;
    country?: Country;
  };
  onUpdate?: (data: {
    theatre?: SalesTheatre;
    regionId?: string;
    countryId?: string;
  }) => void;
  isEditing?: boolean;
}

export function POVDetails({
  pov,
  onUpdate,
  isEditing = false,
}: POVDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>POV Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{pov.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {pov.description}
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Location</h4>
              {isEditing ? (
                <GeographicalSelect
                  selectedTheatre={pov.salesTheatre ?? undefined}
                  selectedRegion={pov.regionId ?? undefined}
                  selectedCountry={pov.countryId ?? undefined}
                  onChange={onUpdate || (() => {})}
                />
              ) : (
                <LocationDisplay
                  salesTheatre={pov.salesTheatre ?? undefined}
                  region={pov.region}
                  country={pov.country}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status & Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium">Status</span>
              <p className="text-sm mt-1">{pov.status}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Priority</span>
              <p className="text-sm mt-1">{pov.priority}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Start Date</span>
              <p className="text-sm mt-1">
                {pov.startDate.toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium">End Date</span>
              <p className="text-sm mt-1">
                {pov.endDate.toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Info */}
      {(pov.customerName || pov.customerContact) && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pov.customerName && (
                <div>
                  <span className="text-sm font-medium">Customer</span>
                  <p className="text-sm mt-1">{pov.customerName}</p>
                </div>
              )}
              {pov.customerContact && (
                <div>
                  <span className="text-sm font-medium">Contact</span>
                  <p className="text-sm mt-1">{pov.customerContact}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
