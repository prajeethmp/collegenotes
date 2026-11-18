export type CategoryId = 'dbms' | 'oops' | 'ds' | 'dlco' | 'dms' | 'others';

export interface CategoryInfo {
  id: CategoryId;
  name: string;
  fullName: string;
  description: string;
  iconName: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  accentColor: string;
}

export type UserRole = 'admin' | 'student';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  notesCount?: number;
  lastLoginAt?: string;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface NoteAttachment {
  id: string;
  name: string;
  size: number; // bytes
  mimeType: string;
  extension: string;
  url: string; // URL or base64 data
  storageType: 'local' | 'blob' | 'cloudinary' | 'inline';
}

export interface Note {
  id: string;
  title: string;
  description: string;
  content?: string; // Rich markdown or plain text
  categoryId: CategoryId;
  tags: string[];
  semester?: string;
  authorId: string;
  authorName: string;
  authorRole?: UserRole;
  attachments: NoteAttachment[];
  viewsCount: number;
  downloadsCount: number;
  likesCount: number;
  likedBy: string[]; // user IDs
  isPinned?: boolean;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  allowPublicRegistration: boolean; // false = Admin Only, true = Open
  maxUploadSizeBytes: number; // e.g. 25MB
  defaultAdminCreated: boolean;
  siteName: string;
  siteTagline: string;
}

export interface AdminStats {
  totalNotes: number;
  totalUsers: number;
  totalDownloads: number;
  totalViews: number;
  categoryBreakdown: Record<CategoryId, number>;
  recentNotes: Note[];
  recentUsers: User[];
}

export interface AuthSession {
  user: User;
  token: string;
}
