import React from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { PoVFormData } from '../PoVCreationForm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface BasicInfoFormProps {
  data: PoVFormData;
  onUpdate: (data: Partial<PoVFormData>) => void;
  errors?: Record<string, string[]>;
}

const statusOptions = ['draft', 'active', 'completed', 'failed'] as const;
type PoVStatus = typeof statusOptions[number];

const basicInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  customer: z.string().min(1, 'Customer is required'),
  startDate: z.date(),
  endDate: z.date(),
  objective: z.string().min(1, 'Objective is required'),
  solution: z.string().min(1, 'Solution is required'),
  status: z.enum(statusOptions),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ data, onUpdate, errors = {} }) => {
  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: data.name,
      customer: data.customer,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : new Date(),
      objective: data.objective,
      solution: data.solution,
      status: data.status,
    },
  });

  const handleFormChange = (field: keyof BasicInfoFormData, value: any) => {
    form.setValue(field, value);
    if (field === 'startDate' || field === 'endDate') {
      onUpdate({ [field]: value.toISOString() });
    } else {
      onUpdate({ [field]: value });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Basic Information</h2>
          <p className="text-muted-foreground">
            Enter the basic details for the Proof of Value project.
          </p>
        </div>

        <Form form={form}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PoV Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter a descriptive name for the PoV"
                      onChange={(e) => handleFormChange('name', e.target.value)}
                    />
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
                    <Input
                      {...field}
                      placeholder="Enter the customer name"
                      onChange={(e) => handleFormChange('customer', e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={(date) => handleFormChange('startDate', date)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={(date) => handleFormChange('endDate', date)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objective"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Objective</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the main objectives of this PoV"
                      className="min-h-[100px]"
                      onChange={(e) => handleFormChange('objective', e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="solution"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Solution</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the proposed solution"
                      className="min-h-[100px]"
                      onChange={(e) => handleFormChange('solution', e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value: PoVStatus) => handleFormChange('status', value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </div>
    </Card>
  );
};

export default BasicInfoForm;
