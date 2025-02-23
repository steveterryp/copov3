import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';
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

interface MetricsGoalsProps {
  data: PoVFormData;
  onUpdate: (data: Partial<PoVFormData>) => void;
  errors?: Record<string, string[]>;
}

interface KPI {
  title: string;
  target: string;
  weight: number;
}

const kpiSchema = z.object({
  title: z.string().min(1, 'KPI title is required'),
  target: z.string().min(1, 'Target is required'),
  weight: z.number().min(0).max(100, 'Weight must be between 0 and 100'),
});

const metricsSchema = z.object({
  kpis: z.array(kpiSchema)
    .min(1, 'At least one KPI is required')
    .refine(
      (kpis) => {
        const totalWeight = kpis.reduce((sum, kpi) => sum + kpi.weight, 0);
        return totalWeight === 100;
      },
      { message: 'Total weight must equal 100%' }
    ),
});

type MetricsFormData = z.infer<typeof metricsSchema>;

const MetricsGoals: React.FC<MetricsGoalsProps> = ({ data, onUpdate, errors = {} }) => {
  const form = useForm<MetricsFormData>({
    resolver: zodResolver(metricsSchema),
    defaultValues: {
      kpis: data.kpis,
    },
  });

  const handleFormChange = (kpis: KPI[]) => {
    form.setValue('kpis', kpis);
    onUpdate({ kpis });
  };

  const handleAddKPI = () => {
    const newKPIs = [
      ...form.getValues('kpis'),
      {
        title: '',
        target: '',
        weight: 0
      }
    ];
    handleFormChange(newKPIs);
  };

  const handleRemoveKPI = (index: number) => {
    const newKPIs = form.getValues('kpis').filter((_, i) => i !== index);
    handleFormChange(newKPIs);
  };

  const handleKPIChange = (
    index: number,
    field: keyof KPI,
    value: string | number
  ) => {
    const newKPIs = [...form.getValues('kpis')];
    newKPIs[index] = {
      ...newKPIs[index],
      [field]: value
    };
    handleFormChange(newKPIs);
  };

  const totalWeight = form.getValues('kpis').reduce((sum, kpi) => sum + kpi.weight, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Metrics & Goals</h2>
        <p className="text-muted-foreground">
          Define the key performance indicators (KPIs) and success metrics for your PoV.
        </p>
      </div>

      <Form form={form}>
        <FormField
          control={form.control}
          name="kpis"
          render={() => (
            <FormItem>
              <div>
                <Button
                  variant="outline"
                  onClick={handleAddKPI}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add KPI
                </Button>
              </div>

              <div className="space-y-4 mt-4">
                {form.getValues('kpis').map((kpi, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-4">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                      <div className="flex-1 space-y-4">
                        <FormItem>
                          <FormLabel>KPI Title</FormLabel>
                          <FormControl>
                            <Input
                              value={kpi.title}
                              onChange={(e) => handleKPIChange(index, 'title', e.target.value)}
                              placeholder="Enter KPI title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormItem>
                            <FormLabel>Target</FormLabel>
                            <FormControl>
                              <Input
                                value={kpi.target}
                                onChange={(e) => handleKPIChange(index, 'target', e.target.value)}
                                placeholder="Define a measurable target"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>

                          <div className="space-y-2">
                            <FormLabel>Weight (%)</FormLabel>
                            <Slider
                              value={[kpi.weight]}
                              onValueChange={(value: number[]) => handleKPIChange(index, 'weight', value[0])}
                              min={0}
                              max={100}
                              step={1}
                            />
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={kpi.weight}
                                onChange={(e) => handleKPIChange(
                                  index,
                                  'weight',
                                  Math.min(100, Math.max(0, Number(e.target.value) || 0))
                                )}
                                className="w-20"
                              />
                              <span className="text-muted-foreground">%</span>
                            </div>
                            <FormMessage />
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveKPI(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card className="p-4 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total Weight</span>
            <span className={`text-xl font-semibold ${totalWeight === 100 ? 'text-green-600' : 'text-destructive'}`}>
              {totalWeight}%
            </span>
          </div>
          {totalWeight !== 100 && (
            <p className="text-sm text-destructive mt-2">
              Total weight should equal 100%
            </p>
          )}
        </Card>
      </Form>
    </div>
  );
};

export default MetricsGoals;
