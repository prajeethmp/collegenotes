import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { User, Note } from './types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'study-nexus-notes-super-secret-key-32-chars-long-minimum-2026'
);

const COOKIE_NAME = 'notes_session_token';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: User): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as User['role'],
      status: payload.status as User['status'],
      createdAt: '',
      updatedAt: '',
    };
  } catch {
    return null;
  }
}

export async function getCurrentUserFromCookies(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export function canManageNote(user: User | null, note: Note): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.id === note.authorId;
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin' && user?.status === 'active';
}

export { COOKIE_NAME };
