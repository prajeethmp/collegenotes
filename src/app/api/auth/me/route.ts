import { NextResponse } from 'next/server';
import { getCurrentUserFromCookies } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const sessionUser = await getCurrentUserFromCookies();
    if (!sessionUser) {
      return NextResponse.json({ user: null });
    }

    // Refresh from DB to verify user is still active
    const user = await db.getUserById(sessionUser.id);
    if (!user || user.status === 'suspended') {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Auth check failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
