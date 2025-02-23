import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/Command';
import { PoVFormData } from '../PoVCreationForm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface TeamMember {
  id: string;
  name: string;
}

interface TeamSelectionProps {
  data: PoVFormData;
  onUpdate: (data: Partial<PoVFormData>) => void;
  errors?: Record<string, string[]>;
}

// Mock data - This would come from an API in production
const mockUsers = {
  projectManagers: [
    { id: 'pm1', name: 'Alice Johnson' },
    { id: 'pm2', name: 'Bob Smith' },
    { id: 'pm3', name: 'Carol White' }
  ],
  salesEngineers: [
    { id: 'se1', name: 'David Lee' },
    { id: 'se2', name: 'Emma Davis' },
    { id: 'se3', name: 'Frank Miller' },
    { id: 'se4', name: 'Grace Wilson' }
  ],
  technicalTeam: [
    { id: 'tt1', name: 'Henry Brown' },
    { id: 'tt2', name: 'Ivy Chen' },
    { id: 'tt3', name: 'Jack Taylor' },
    { id: 'tt4', name: 'Kelly Martinez' }
  ]
} satisfies Record<string, TeamMember[]>;

const teamSchema = z.object({
  projectManager: z.string().min(1, 'Project manager is required'),
  salesEngineers: z.array(z.string()).min(1, 'At least one sales engineer is required'),
  technicalTeam: z.array(z.string()).min(1, 'At least one technical team member is required'),
});

type TeamFormData = z.infer<typeof teamSchema>;

const TeamSelection: React.FC<TeamSelectionProps> = ({ data, onUpdate, errors = {} }) => {
  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      projectManager: data.projectManager,
      salesEngineers: data.salesEngineers,
      technicalTeam: data.technicalTeam,
    },
  });

  const handleFormChange = (field: keyof TeamFormData, value: any) => {
    form.setValue(field, value);
    onUpdate({ [field]: value });
  };

  const handleMultiSelect = (field: 'salesEngineers' | 'technicalTeam') => (value: string) => {
    const currentValues = form.getValues(field);
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    handleFormChange(field, newValues);
  };

  const getTeamMemberName = (id: string, type: 'pm' | 'se' | 'tt'): string => {
    const teamMap = {
      pm: mockUsers.projectManagers,
      se: mockUsers.salesEngineers,
      tt: mockUsers.technicalTeam
    };
    const member = teamMap[type].find((m) => m.id === id);
    return member?.name || id;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Team Selection</h2>
        <p className="text-muted-foreground">
          Select team members and assign roles for the PoV project.
        </p>
      </div>

      <Form form={form}>
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="projectManager"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Manager</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => handleFormChange('projectManager', value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project manager" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mockUsers.projectManagers.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        {pm.name}
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
            name="salesEngineers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sales Engineers</FormLabel>
                <FormControl>
                  <Card className="p-4">
                    <Command className="rounded-lg border shadow-md">
                      <CommandInput placeholder="Search sales engineers..." />
                      <CommandEmpty>No engineers found.</CommandEmpty>
                      <CommandGroup>
                        {mockUsers.salesEngineers.map((se) => (
                          <CommandItem
                            key={se.id}
                            onSelect={() => handleMultiSelect('salesEngineers')(se.id)}
                            className="flex items-center justify-between"
                          >
                            <span>{se.name}</span>
                            {field.value.includes(se.id) && (
                              <Badge variant="secondary">Selected</Badge>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {field.value.map((id) => (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => handleMultiSelect('salesEngineers')(id)}
                        >
                          {getTeamMemberName(id, 'se')}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="technicalTeam"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Technical Team</FormLabel>
                <FormControl>
                  <Card className="p-4">
                    <Command className="rounded-lg border shadow-md">
                      <CommandInput placeholder="Search technical team..." />
                      <CommandEmpty>No team members found.</CommandEmpty>
                      <CommandGroup>
                        {mockUsers.technicalTeam.map((tt) => (
                          <CommandItem
                            key={tt.id}
                            onSelect={() => handleMultiSelect('technicalTeam')(tt.id)}
                            className="flex items-center justify-between"
                          >
                            <span>{tt.name}</span>
                            {field.value.includes(tt.id) && (
                              <Badge variant="secondary">Selected</Badge>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {field.value.map((id) => (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => handleMultiSelect('technicalTeam')(id)}
                        >
                          {getTeamMemberName(id, 'tt')}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </div>
  );
};

export default TeamSelection;
