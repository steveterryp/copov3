import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { updateUserSettings } from '../services/settings';
import { UserSettingsUpdate } from '../types';

export async function handlePutSettings(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data: UserSettingsUpdate = await req.json();

    try {
      const settings = await updateUserSettings(user.userId, data);
      return NextResponse.json({ data: { settings } });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid timezone') {
        return NextResponse.json(
          { error: 'Invalid timezone' },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('[Settings Update Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
