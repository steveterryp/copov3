'use client';

import React from 'react';
import { POVStatus, Priority } from '@/lib/pov/types/core';
import { SalesTheatre } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/Form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { GeographicalSelect } from '@/components/ui/GeographicalSelect';

const povFormSchema = z.object({
  salesTheatre: z.nativeEnum(SalesTheatre).optional(),
  regionId: z.string().optional(),
  countryId: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  customer: z.string().min(1, 'Customer is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.nativeEnum(POVStatus),
  expectedDuration: z.string(),
  successCriteria: z.string().min(1, 'Success criteria is required'),
  technicalRequirements: z.string().min(1, 'Technical requirements are required'),
  teamSize: z.string(),
});

type POVFormData = z.infer<typeof povFormSchema>;

export default function CreatePovPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<POVFormData>({
    resolver: zodResolver(povFormSchema),
    defaultValues: {
      name: '',
      customer: '',
      description: '',
      status: POVStatus.PROJECTED,
      expectedDuration: '30',
      successCriteria: '',
      technicalRequirements: '',
      teamSize: '1-2',
      salesTheatre: undefined,
      regionId: undefined,
      countryId: undefined,
    },
  });

  const onSubmit = async (data: POVFormData) => {
    setError(null);

    try {
      // Transform form data to match CreatePOVRequest type
      const now = new Date();
      const startDate = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      ));

      const endDate = new Date(startDate);
      endDate.setUTCDate(startDate.getUTCDate() + parseInt(data.expectedDuration, 10));

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date calculation');
      }

      // Create request data with validated dates
      const requestData = {
        salesTheatre: data.salesTheatre,
        regionId: data.regionId,
        countryId: data.countryId,
        title: data.name,
        description: data.description,
        status: POVStatus.PROJECTED, // Always start as projected
        priority: Priority.MEDIUM, // Default priority
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        metadata: {
          customer: data.customer,
          teamSize: data.teamSize,
          successCriteria: data.successCriteria,
          technicalRequirements: data.technicalRequirements,
        }
      };

      const response = await fetch('/api/pov', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create PoV');
      }

      router.push('/pov/list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-6">Create New PoV</h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form form={form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PoV Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter PoV name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter customer name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={POVStatus.PROJECTED}>Projected</SelectItem>
                        <SelectItem value={POVStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={POVStatus.VALIDATION}>Validation</SelectItem>
                        <SelectItem value={POVStatus.STALLED}>Stalled</SelectItem>
                        <SelectItem value={POVStatus.WON}>Won</SelectItem>
                        <SelectItem value={POVStatus.LOST}>Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Current phase of the PoV</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Duration (days)</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="45">45 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="successCriteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Success Criteria</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Define what constitutes a successful PoV" />
                  </FormControl>
                  <FormDescription>Define what constitutes a successful PoV</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="technicalRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technical Requirements</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="List all technical requirements and dependencies" />
                  </FormControl>
                  <FormDescription>List all technical requirements and dependencies</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-6">
              <div>
                <FormLabel>Geographical Information</FormLabel>
                <GeographicalSelect
                  selectedTheatre={form.watch('salesTheatre')}
                  selectedRegion={form.watch('regionId')}
                  selectedCountry={form.watch('countryId')}
                  onChange={({ theatre, regionId, countryId }) => {
                    form.setValue('salesTheatre', theatre);
                    form.setValue('regionId', regionId);
                    form.setValue('countryId', countryId);
                  }}
                />
                <FormDescription>Select the geographical location for this POV</FormDescription>
              </div>

              <FormField
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Size</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">1-2 people</SelectItem>
                      <SelectItem value="3-5">3-5 people</SelectItem>
                      <SelectItem value="6-10">6-10 people</SelectItem>
                      <SelectItem value="10+">10+ people</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Create PoV'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
