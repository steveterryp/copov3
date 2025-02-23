import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { PoVFormData } from '../PoVCreationForm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface ResourcesProps {
  data: PoVFormData;
  onUpdate: (data: Partial<PoVFormData>) => void;
  errors?: Record<string, string[]>;
}

type ResourceType = 'Hardware' | 'Software License' | 'Cloud Infrastructure' | 'Development Environment' | 'Testing Environment' | 'Technical Support' | 'Training' | 'Documentation' | 'Other';

interface Resource {
  type: ResourceType;
  quantity: number;
  notes: string;
}

const resourceTypes: ResourceType[] = [
  'Hardware',
  'Software License',
  'Cloud Infrastructure',
  'Development Environment',
  'Testing Environment',
  'Technical Support',
  'Training',
  'Documentation',
  'Other'
];

const resourceSchema = z.object({
  type: z.enum(['Hardware', 'Software License', 'Cloud Infrastructure', 'Development Environment', 'Testing Environment', 'Technical Support', 'Training', 'Documentation', 'Other'] as const),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().min(1, 'Notes are required'),
});

const resourcesSchema = z.object({
  budget: z.number().min(0, 'Budget must be non-negative'),
  resources: z.array(resourceSchema).min(1, 'At least one resource is required'),
});

type ResourcesFormData = z.infer<typeof resourcesSchema>;

const Resources: React.FC<ResourcesProps> = ({ data, onUpdate, errors = {} }) => {
  const form = useForm<ResourcesFormData>({
    resolver: zodResolver(resourcesSchema),
    defaultValues: {
      budget: data.budget,
      resources: data.resources,
    },
  });

  const handleFormChange = (field: keyof ResourcesFormData, value: any) => {
    form.setValue(field, value);
    onUpdate({ [field]: value });
  };

  const handleAddResource = () => {
    const newResources = [
      ...form.getValues('resources'),
      {
        type: resourceTypes[0],
        quantity: 1,
        notes: ''
      }
    ];
    handleFormChange('resources', newResources);
  };

  const handleRemoveResource = (index: number) => {
    const newResources = form.getValues('resources').filter((_, i) => i !== index);
    handleFormChange('resources', newResources);
  };

  const handleResourceChange = (
    index: number,
    field: keyof Resource,
    value: string | number
  ) => {
    const newResources = [...form.getValues('resources')];
    newResources[index] = {
      ...newResources[index],
      [field]: field === 'quantity' ? Number(value) : value
    };
    handleFormChange('resources', newResources);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Resources & Budget</h2>
        <p className="text-muted-foreground">
          Define the budget and resource requirements for your PoV.
        </p>
      </div>

      <Form form={form}>
        {/* Budget Section */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Budget</h3>
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Budget</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => handleFormChange('budget', Number(e.target.value))}
                        className="pl-8"
                        placeholder="Enter the total budget allocated for this PoV"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* Resources Section */}
        <FormField
          control={form.control}
          name="resources"
          render={() => (
            <FormItem>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Resource Requirements</h3>

                <div>
                  <Button
                    variant="outline"
                    onClick={handleAddResource}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Resource
                  </Button>
                </div>

                <div className="space-y-4">
                  {form.getValues('resources').map((resource, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-4">
                        <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormItem>
                              <FormLabel>Resource Type</FormLabel>
                              <Select
                                value={resource.type}
                                onValueChange={(value) => handleResourceChange(index, 'type', value)}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select resource type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {resourceTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>

                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  value={resource.quantity}
                                  onChange={(e) => handleResourceChange(
                                    index,
                                    'quantity',
                                    Math.max(1, Number(e.target.value) || 1)
                                  )}
                                  min={1}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          </div>

                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                value={resource.notes}
                                onChange={(e) => handleResourceChange(index, 'notes', e.target.value)}
                                placeholder="Add any specific requirements or notes"
                                className="min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveResource(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </Form>
    </div>
  );
};

export default Resources;
