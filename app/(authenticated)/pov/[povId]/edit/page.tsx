'use client';

import React from 'react';
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
} from '@/components/ui/Form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/Command';
import { Badge } from '@/components/ui/Badge';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { POVStatus, Priority } from '@/lib/types/pov';

interface User {
  id: string;
  name: string;
  email: string;
}

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(Object.values(POVStatus) as [string, ...string[]]),
  priority: z.enum(Object.values(Priority) as [string, ...string[]]),
  startDate: z.date(),
  endDate: z.date(),
  teamMembers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  })),
});

type FormData = z.infer<typeof formSchema>;

export default function PoVEditPage({ params }: { params: { povId: string } }) {
  const router = useRouter();
  const [pov, setPov] = React.useState<any>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        // Fetch PoV and available team members in parallel
        const [povResponse, usersResponse] = await Promise.all([
          fetch(`/api/pov/${params.povId}`),
          fetch(`/api/pov/${params.povId}/team/available`)
        ]);

        if (!povResponse.ok) {
          throw new Error('Failed to fetch PoV');
        }

        const povData = await povResponse.json();
        setPov(povData);
        setSelectedTeamMembers(povData.team?.members?.map((m: any) => m.user) || []);

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.povId]);

  const handleSubmit = async (data: FormData) => {
    setSaving(true);

    try {
      const response = await fetch(`/api/pov/${params.povId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          teamMembers: data.teamMembers.map(user => user.id),
          metadata: pov.metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to update PoV');
      }

      router.push(`/pov/${params.povId}`);
    } catch (err) {
      setError(err instanceof Error ? (err as Error) : new Error('An error occurred'));
      setSaving(false);
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      status: POVStatus.PROJECTED,
      priority: Priority.MEDIUM,
      startDate: new Date(),
      endDate: new Date(),
      teamMembers: [],
    },
  });

  React.useEffect(() => {
    if (pov) {
      form.reset({
        title: pov.title,
        description: pov.description,
        status: pov.status,
        priority: pov.priority,
        startDate: new Date(pov.startDate),
        endDate: new Date(pov.endDate),
        teamMembers: selectedTeamMembers,
      });
    }
  }, [pov, selectedTeamMembers, form]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-destructive">
        Error: {error.message}
      </div>
    );
  }

  if (!pov) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">PoV not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-6">Edit PoV</h1>

        <Form form={form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter PoV title" />
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
                    <Input {...field} placeholder="Enter PoV description" />
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
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(POVStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Priority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="teamMembers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Members</FormLabel>
                  <Command>
                    <CommandInput placeholder="Search team members..." />
                    <CommandEmpty>No team members found.</CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => {
                            const newValue = field.value.some(m => m.id === user.id)
                              ? field.value.filter(m => m.id !== user.id)
                              : [...field.value, user];
                            field.onChange(newValue);
                          }}
                        >
                          {user.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {field.value.map((member) => (
                      <Badge
                        key={member.id}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => {
                          field.onChange(field.value.filter(m => m.id !== member.id));
                        }}
                      >
                        {member.name}
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/pov/${params.povId}`)}
                disabled={saving}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
