import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserFromCookies, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUserFromCookies();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const stats = await db.getAdminStats();
    return NextResponse.json({ success: true, stats });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch admin stats';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
