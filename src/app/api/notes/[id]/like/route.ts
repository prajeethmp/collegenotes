import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserFromCookies } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUserFromCookies();

    // Determine an identifier for the liker (user id or client ip)
    const likerId = user?.id || req.headers.get('x-forwarded-for') || 'guest_user';

    const result = await db.toggleNoteLike(id, likerId);
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to toggle like';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
