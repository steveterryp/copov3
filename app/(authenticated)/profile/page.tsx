'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Separator } from '@/components/ui/Separator';
import { Switch } from '@/components/ui/Switch';
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
  FormDescription,
} from '@/components/ui/Form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import TimezoneSelect from '@/components/settings/TimezoneSelect';
import { useSettings } from '@/lib/hooks/useSettings';
import { useAuth } from '@/lib/hooks/useAuth';

import { UserSettings, defaultUserSettings } from '@/lib/types/settings';

const settingsFormSchema = z.object({
  timezone: z.string(),
  display: z.object({
    timeFormat: z.enum(['12h', '24h']).optional(),
    firstDayOfWeek: z.union([z.literal(0), z.literal(1)]).optional(),
  }).optional(),
  notifications: z.object({
    email: z.boolean(),
    inApp: z.boolean(),
    desktop: z.boolean(),
  }).optional(),
  accessibility: z.object({
    reducedMotion: z.boolean().optional(),
    highContrast: z.boolean().optional(),
    screenReader: z.boolean().optional(),
  }).optional(),
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { settings, updateSettings, isLoading } = useSettings();
  const [saving, setSaving] = React.useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      timezone: settings.timezone || defaultUserSettings.timezone,
      display: {
        timeFormat: settings.display?.timeFormat || defaultUserSettings.display?.timeFormat,
        firstDayOfWeek: settings.display?.firstDayOfWeek || defaultUserSettings.display?.firstDayOfWeek,
      },
      notifications: {
        email: settings.notifications?.email ?? defaultUserSettings.notifications?.email,
        inApp: settings.notifications?.inApp ?? defaultUserSettings.notifications?.inApp,
        desktop: settings.notifications?.desktop ?? defaultUserSettings.notifications?.desktop,
      },
      accessibility: {
        reducedMotion: settings.accessibility?.reducedMotion ?? defaultUserSettings.accessibility?.reducedMotion,
        highContrast: settings.accessibility?.highContrast ?? defaultUserSettings.accessibility?.highContrast,
        screenReader: settings.accessibility?.screenReader ?? defaultUserSettings.accessibility?.screenReader,
      },
    },
  });

  // Update form values when server settings are loaded
  React.useEffect(() => {
    if (!isLoading) {
      form.reset({
        timezone: settings.timezone,
        display: {
          timeFormat: settings.display?.timeFormat || '24h',
          firstDayOfWeek: settings.display?.firstDayOfWeek || 1,
        },
        notifications: {
          email: settings.notifications?.email || false,
          inApp: settings.notifications?.inApp || false,
          desktop: settings.notifications?.desktop || false,
        },
        accessibility: {
          reducedMotion: settings.accessibility?.reducedMotion || false,
          highContrast: settings.accessibility?.highContrast || false,
          screenReader: settings.accessibility?.screenReader || false,
        },
      });
    }
  }, [settings, isLoading, form]);

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);
    try {
      await updateSettings(data);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

      {/* Profile Information */}
      <Card className="p-6 mb-6">
        <div className="flex items-center mb-6">
          <Avatar className="h-20 w-20 mr-4">
            <AvatarImage src="/path/to/avatar.jpg" alt={user?.name} />
            <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{user?.name}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="space-y-2">
              <div className="font-medium">Name</div>
              <Input value={user?.name} disabled />
            </div>
          </div>
          <div>
            <div className="space-y-2">
              <div className="font-medium">Email</div>
              <Input value={user?.email} disabled />
            </div>
          </div>
        </div>
      </Card>

      <Form form={form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Time & Date Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Time & Date</h2>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <TimezoneSelect
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="display.timeFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Format</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12h">12-hour</SelectItem>
                          <SelectItem value="24h">24-hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="display.firstDayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Day of Week</FormLabel>
                      <Select
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select first day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </Card>

            {/* Notification Settings */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Notifications</h2>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="notifications.email"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Email Notifications</FormLabel>
                        <FormDescription>Receive notifications via email</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notifications.inApp"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>In-App Notifications</FormLabel>
                        <FormDescription>Show notifications in the app</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notifications.desktop"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Desktop Notifications</FormLabel>
                        <FormDescription>Show desktop notifications</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          </div>

          {/* Accessibility Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Accessibility</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="accessibility.reducedMotion"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Reduced Motion</FormLabel>
                      <FormDescription>Minimize animations</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accessibility.highContrast"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>High Contrast</FormLabel>
                      <FormDescription>Increase visual contrast</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accessibility.screenReader"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Screen Reader</FormLabel>
                      <FormDescription>Optimize for screen readers</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </Card>

          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              disabled={saving || form.formState.isSubmitting}
              className="min-w-[120px]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
