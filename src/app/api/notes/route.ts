import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserFromCookies } from '@/lib/auth';
import { CategoryId, Note } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';

const VALID_CATEGORIES = Object.keys(CATEGORIES) as CategoryId[];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const sort = searchParams.get('sort') || 'newest';
    const authorId = searchParams.get('authorId') || undefined;

    const notes = await db.getNotes({ category, search, sort, authorId });
    return NextResponse.json({ success: true, notes });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notes';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to post notes' }, { status: 401 });
    }

    if (user.status === 'suspended') {
      return NextResponse.json({ error: 'Your account is suspended.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, content, categoryId, tags = [], semester, attachments = [], isPinned } = body;

    if (!title || !description || !categoryId) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      );
    }

    const normalizedCategory = categoryId.toLowerCase() as CategoryId;
    if (!VALID_CATEGORIES.includes(normalizedCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Allowed: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newNote: Note = {
      id: noteId,
      title: title.trim(),
      description: description.trim(),
      content: content || '',
      categoryId: normalizedCategory,
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean) : [],
      semester: semester ? semester.trim() : undefined,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      attachments: attachments || [],
      viewsCount: 0,
      downloadsCount: 0,
      likesCount: 0,
      likedBy: [],
      // Only admin can pin notes
      isPinned: user.role === 'admin' ? !!isPinned : false,
      createdAt: now,
      updatedAt: now,
    };

    const created = await db.createNote(newNote);
    return NextResponse.json({ success: true, note: created }, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create note';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
