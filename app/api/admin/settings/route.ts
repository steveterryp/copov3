import { createHandler } from '@/lib/api-handler';
import { getAdminSettingsHandler, updateAdminSettingsHandler } from '@/lib/admin/handlers/settings';
import { SystemSettings } from '@/lib/admin/types';

export const GET = createHandler<SystemSettings>(getAdminSettingsHandler, { requireAuth: true });
export const PUT = createHandler<SystemSettings>(updateAdminSettingsHandler, { requireAuth: true });
