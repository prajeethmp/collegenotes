import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserFromCookies, isAdmin } from '@/lib/auth';

// GET /api/admin/settings - Get settings (public read for registration page check)
export async function GET() {
  try {
    const settings = await db.getSettings();
    return NextResponse.json({
      success: true,
      settings: {
        allowPublicRegistration: settings.allowPublicRegistration,
        maxUploadSizeBytes: settings.maxUploadSizeBytes,
        siteName: settings.siteName,
        siteTagline: settings.siteTagline,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch settings';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PATCH /api/admin/settings - Update settings (admin only)
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.allowPublicRegistration === 'boolean') {
      updates.allowPublicRegistration = body.allowPublicRegistration;
    }
    if (typeof body.maxUploadSizeBytes === 'number') {
      updates.maxUploadSizeBytes = body.maxUploadSizeBytes;
    }
    if (body.siteName) updates.siteName = body.siteName;
    if (body.siteTagline) updates.siteTagline = body.siteTagline;

    const updated = await db.updateSettings(updates);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
