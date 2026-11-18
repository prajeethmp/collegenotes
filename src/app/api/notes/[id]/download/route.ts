import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const note = await db.getNoteById(id);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await db.incrementNoteDownloads(id);
    return NextResponse.json({ success: true, downloadsCount: (note.downloadsCount || 0) + 1 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to record download';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
