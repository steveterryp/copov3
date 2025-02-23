import { UserSettings } from '@prisma/client';
import { DefaultSettingsSelect } from './select';
import { UserSettings as UserSettingsType } from '../types';

export function mapSettingsToResponse(settings: DefaultSettingsSelect) {
  return {
    id: settings.id,
    userId: settings.userId,
    settings: settings.settings as unknown as UserSettingsType,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  };
}

export function mapSettingsArrayToResponse(settings: DefaultSettingsSelect[]) {
  return settings.map(mapSettingsToResponse);
}

export function validateTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
}
