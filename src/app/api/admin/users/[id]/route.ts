import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUserFromCookies, isAdmin, hashPassword } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUserFromCookies();

    if (!isAdmin(currentUser)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    // Update status (active or suspended)
    if (body.status && ['active', 'suspended'].includes(body.status)) {
      if (currentUser?.id === id && body.status === 'suspended') {
        return NextResponse.json({ error: 'You cannot suspend your own admin account' }, { status: 400 });
      }
      updates.status = body.status;
    }

    // Update role (admin or student)
    if (body.role && ['admin', 'student'].includes(body.role)) {
      if (currentUser?.id === id && body.role === 'student') {
        return NextResponse.json({ error: 'You cannot remove admin rights from your own account' }, { status: 400 });
      }
      updates.role = body.role;
    }

    // Reset password
    if (body.newPassword) {
      if (body.newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      updates.passwordHash = await hashPassword(body.newPassword);
    }

    // Name update
    if (body.name && body.name.trim()) {
      updates.name = body.name.trim();
    }

    const updated = await db.updateUser(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUserFromCookies();

    if (!isAdmin(currentUser)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    if (currentUser?.id === id) {
      return NextResponse.json({ error: 'You cannot delete your own admin account' }, { status: 400 });
    }

    const success = await db.deleteUser(id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
