import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserFromCookies, isAdmin, hashPassword } from '@/lib/auth';
import { UserWithPassword } from '@/lib/types';

// GET /api/admin/users - List all users
export async function GET() {
  try {
    const user = await getCurrentUserFromCookies();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const users = await db.getUsers();
    return NextResponse.json({ success: true, users });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST /api/admin/users - Admin directly registers a new user
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUserFromCookies();
    if (!isAdmin(currentUser)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { name, email, password, role = 'student' } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const existingUser = await db.getUserByEmail(email.trim());
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email address already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser: UserWithPassword = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role === 'admin' ? 'admin' : 'student',
      status: 'active',
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notesCount: 0,
    };

    const created = await db.createUser(newUser);
    return NextResponse.json({
      success: true,
      user: created,
      message: `User ${created.name} (${created.email}) created successfully as ${created.role}.`,
    }, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
