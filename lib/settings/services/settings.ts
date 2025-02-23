import { prisma } from '@/lib/prisma';
import { defaultSettingsSelect } from '../prisma/select';
import { mapSettingsToResponse, validateTimezone } from '../prisma/mappers';
import { UserSettingsUpdate, defaultUserSettings } from '../types';
import { trackActivity } from '@/lib/auth/audit';

export async function getUserSettings(userId: string) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: defaultSettingsSelect,
  });

  if (!settings) {
    return null;
  }

  return mapSettingsToResponse(settings);
}

export async function updateUserSettings(userId: string, data: UserSettingsUpdate) {
  // Validate timezone if provided
  if (data.timezone && !validateTimezone(data.timezone)) {
    throw new Error('Invalid timezone');
  }

  // Get existing settings
  const existingSettings = await prisma.userSettings.findUnique({
    where: { userId },
    select: defaultSettingsSelect,
  });

  // Update or create settings
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: {
      settings: {
        ...((existingSettings?.settings as object) || {}),
        ...data,
      },
    },
    create: {
      userId,
      settings: {
        ...defaultUserSettings,
        ...data,
      },
    },
    select: defaultSettingsSelect,
  });

  // Track activity
  await trackActivity(
    userId,
    'update',
    'settings',
    {
      resourceId: settings.id,
      changes: Object.keys(data),
    }
  );

  return mapSettingsToResponse(settings);
}
