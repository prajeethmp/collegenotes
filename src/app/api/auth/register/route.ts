import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, getCurrentUserFromCookies, createSessionToken, COOKIE_NAME } from '@/lib/auth';
import { UserWithPassword } from '@/lib/types';

export async function POST(req: Request) {
  try {
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

    const settings = await db.getSettings();
    const currentUser = await getCurrentUserFromCookies();
    const isCallerAdmin = currentUser?.role === 'admin' && currentUser?.status === 'active';

    // Authority rule: if public registration is disabled, only Admin can register users
    if (!settings.allowPublicRegistration && !isCallerAdmin) {
      return NextResponse.json(
        {
          error:
            'Direct registration is restricted by the administrator. Please ask your administrator to create your account.',
          adminOnly: true,
        },
        { status: 403 }
      );
    }

    const existingUser = await db.getUserByEmail(email.trim());
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Only admin can create another admin
    const assignedRole = isCallerAdmin && role === 'admin' ? 'admin' : 'student';

    const newUser: UserWithPassword = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: assignedRole,
      status: 'active',
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notesCount: 0,
    };

    const createdUser = await db.createUser(newUser);

    // If registered by self (not by admin on the admin panel), sign them in immediately
    const response = NextResponse.json({
      success: true,
      user: createdUser,
      message: isCallerAdmin
        ? `User ${createdUser.name} registered successfully by Administrator`
        : 'Account created successfully',
    });

    if (!isCallerAdmin) {
      const token = await createSessionToken(createdUser);
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
