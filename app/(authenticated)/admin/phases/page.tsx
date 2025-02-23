'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/Form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Loader2Icon } from 'lucide-react';
import { PhaseType } from '@prisma/client';
import { toast } from 'sonner';

interface PhaseTemplate {
  id: string;
  name: string;
  description: string | null;
  type: PhaseType;
  isDefault: boolean;
  workflow: any;
  phases: Array<{
    id: string;
    name: string;
    type: PhaseType;
    pov: {
      id: string;
      title: string;
      status: string;
    };
  }>;
}

export default function PhasesAdminPage() {
  const router = useRouter();
  const [phases, setPhases] = useState<PhaseTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<PhaseTemplate | null>(null);
const phaseFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.nativeEnum(PhaseType),
  workflow: z.record(z.any()).default({}),
  isDefault: z.boolean().default(false),
});

type PhaseFormData = z.infer<typeof phaseFormSchema>;

  useEffect(() => {
    fetchPhases();
  }, []);

  const fetchPhases = async () => {
    try {
      const response = await fetch('/api/admin/phases');
      if (!response.ok) throw new Error('Failed to fetch phases');
      const data = await response.json();
      setPhases(data);
    } catch (error) {
      toast.error('Error loading phases');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const form = useForm<PhaseFormData>({
    resolver: zodResolver(phaseFormSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'PLANNING' as PhaseType,
      workflow: {},
      isDefault: false,
    }
  });

  const onSubmit = async (data: PhaseFormData) => {
    setIsLoading(true);

    try {
      const url = '/api/admin/phases';
      const method = editingPhase ? 'PUT' : 'POST';
      const body = editingPhase
        ? { ...data, id: editingPhase.id }
        : data;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save phase');

      toast.success(`Phase ${editingPhase ? 'updated' : 'created'} successfully`);
      setIsDialogOpen(false);
      fetchPhases();
    } catch (error) {
      toast.error('Error saving phase');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this phase template?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/phases?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete phase');

      toast.success('Phase deleted successfully');
      fetchPhases();
    } catch (error) {
      toast.error('Error deleting phase');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (phase: PhaseTemplate) => {
    setEditingPhase(phase);
    form.reset({
      name: phase.name,
      description: phase.description || '',
      type: phase.type,
      workflow: phase.workflow,
      isDefault: phase.isDefault,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPhase(null);
    form.reset({
      name: '',
      description: '',
      type: 'PLANNING' as PhaseType,
      workflow: {},
      isDefault: false,
    });
    setIsDialogOpen(true);
  };

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <Loader2Icon className="h-8 w-8 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Phase Templates</h1>
          <p className="text-muted-foreground">
            Create and manage phase templates for PoVs. Configure workflows and approval processes.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={openCreateDialog}>
            Create Phase Template
          </Button>
        </div>
      </div>

      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phases.map((phase) => (
                <TableRow key={phase.id}>
                  <TableCell>{phase.name}</TableCell>
                  <TableCell>{phase.type}</TableCell>
                  <TableCell>{phase.isDefault ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{phase.phases.length} PoVs</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(phase)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(phase.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {phases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No phase templates available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPhase ? 'Edit Phase Template' : 'Create Phase Template'}
            </DialogTitle>
          </DialogHeader>

          <Form form={form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter phase template name"
                      />
                    </FormControl>
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
                      <Input
                        {...field}
                        placeholder="Enter description"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select phase type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PhaseType.PLANNING}>Planning</SelectItem>
                          <SelectItem value={PhaseType.EXECUTION}>Execution</SelectItem>
                          <SelectItem value={PhaseType.REVIEW}>Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        id="default-template"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel htmlFor="default-template">Default Template</FormLabel>
                  </FormItem>
                )}
              />

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || form.formState.isSubmitting}>
                    {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
