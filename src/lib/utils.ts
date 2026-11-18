import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CategoryId } from './types';
import { CATEGORIES, FILE_EXTENSIONS } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    
    // Relative time if within 7 days
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffDays === 0) {
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      return `${diffHr}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Recently';
  }
}

export type FileCategory = 'pdf' | 'image' | 'doc' | 'presentation' | 'sheet' | 'code' | 'text' | 'archive' | 'other';

export function getFileTypeCategory(extension: string): FileCategory {
  const ext = extension.toLowerCase().replace('.', '');
  for (const [cat, extensions] of Object.entries(FILE_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return cat as FileCategory;
    }
  }
  return 'other';
}

export function getCategoryInfo(categoryId: string) {
  const normalized = categoryId.toLowerCase() as CategoryId;
  return CATEGORIES[normalized] || CATEGORIES.others;
}
