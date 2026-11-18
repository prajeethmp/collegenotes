import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserFromCookies, canManageNote } from '@/lib/auth';
import { CategoryId } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';

const VALID_CATEGORIES = Object.keys(CATEGORIES) as CategoryId[];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const note = await db.getNoteById(id);

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Increment view count asynchronously
    db.incrementNoteViews(id).catch(console.error);

    return NextResponse.json({ success: true, note });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch note';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUserFromCookies();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const note = await db.getNoteById(id);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check authority: Author or Admin
    if (!canManageNote(user, note)) {
      return NextResponse.json({ error: 'You do not have permission to modify this note' }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.title) updates.title = body.title.trim();
    if (body.description) updates.description = body.description.trim();
    if (body.content !== undefined) updates.content = body.content;
    if (body.semester !== undefined) updates.semester = body.semester;
    if (Array.isArray(body.tags)) updates.tags = body.tags;
    if (Array.isArray(body.attachments)) updates.attachments = body.attachments;

    if (body.categoryId) {
      const normalized = body.categoryId.toLowerCase() as CategoryId;
      if (VALID_CATEGORIES.includes(normalized)) {
        updates.categoryId = normalized;
      }
    }

    // Only admin can pin/unpin notes
    if (user.role === 'admin' && body.isPinned !== undefined) {
      updates.isPinned = !!body.isPinned;
    }

    const updated = await db.updateNote(id, updates);
    return NextResponse.json({ success: true, note: updated });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update note';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUserFromCookies();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const note = await db.getNoteById(id);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check authority: Author or Admin
    if (!canManageNote(user, note)) {
      return NextResponse.json({ error: 'You do not have permission to delete this note' }, { status: 403 });
    }

    const deleted = await db.deleteNote(id);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
