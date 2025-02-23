import { NextRequest } from 'next/server';
import { TokenPayload, ApiResponse } from '@/lib/types/auth';
import { AdminSettingsService } from '../services/settings';
import { SystemSettings, UpdateSettingRequest } from '../types';
import { ApiError, ErrorCode } from '@/lib/errors';
import { trackActivity } from '@/lib/auth/audit';

export async function getAdminSettingsHandler(
  _req: NextRequest,
  _context: { params: Record<string, string> },
  user?: TokenPayload
): Promise<ApiResponse<SystemSettings>> {
  try {
    // Check if user exists and has admin access
    if (!user || user.role !== 'ADMIN') {
      throw new ApiError(ErrorCode.FORBIDDEN, 'Not authorized to access admin settings');
    }

    const settings = await AdminSettingsService.getSettings();

    return {
      data: settings,
    };
  } catch (error) {
    console.error('[getAdminSettingsHandler]:', error);
    throw error;
  }
}

export async function updateAdminSettingsHandler(
  req: NextRequest,
  _context: { params: Record<string, string> },
  user?: TokenPayload
): Promise<ApiResponse<SystemSettings>> {
  try {
    // Check if user exists and has admin access
    if (!user || user.role !== 'ADMIN') {
      throw new ApiError(ErrorCode.FORBIDDEN, 'Not authorized to modify admin settings');
    }

    const updates: UpdateSettingRequest[] = await req.json();
    const settings = await AdminSettingsService.updateSettings(updates);

    // Track activity
    await trackActivity(
      user.userId,
      'SETTINGS',
      'UPDATE',
      { updates }
    );

    return {
      data: settings,
    };
  } catch (error) {
    console.error('[updateAdminSettingsHandler]:', error);
    throw error;
  }
}
