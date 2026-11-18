'use client';

import React, { useState } from 'react';
import { Note, NoteAttachment } from '@/lib/types';
import { getCategoryInfo, formatBytes, formatDate, getFileTypeCategory } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  Download,
  Eye,
  Heart,
  Share2,
  Pin,
  Trash2,
  Edit,
  ExternalLink,
  Shield,
  Sparkles,
} from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onPreview: (note: Note) => void;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onLikeChange?: (noteId: string, newCount: number, liked: boolean) => void;
  onPinToggle?: (noteId: string, currentPinStatus: boolean) => void;
}

export default function NoteCard({
  note,
  onPreview,
  onEdit,
  onDelete,
  onLikeChange,
  onPinToggle,
}: NoteCardProps) {
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();
  const category = getCategoryInfo(note.categoryId);

  const [likesCount, setLikesCount] = useState(note.likesCount || 0);
  const [isLiked, setIsLiked] = useState(user ? note.likedBy?.includes(user.id) : false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const canModify = user && (user.role === 'admin' || user.id === note.authorId);

  // File type icon selector
  const primaryAttachment: NoteAttachment | undefined = note.attachments?.[0];
  const fileCategory = primaryAttachment
    ? getFileTypeCategory(primaryAttachment.extension)
    : note.content
    ? 'text'
    : 'other';

  const renderFileIcon = () => {
    switch (fileCategory) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-500" />;
      case 'code':
        return <FileCode className="w-4 h-4 text-indigo-500" />;
      case 'sheet':
        return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
      case 'archive':
        return <FileArchive className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  // Like action
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);

    try {
      const res = await fetch(`/api/notes/${note.id}/like`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.liked);
        setLikesCount(data.count);
        if (onLikeChange) onLikeChange(note.id, data.count, data.liked);
      }
    } catch {
      // Ignore like error
    } finally {
      setIsLiking(false);
    }
  };

  // Direct download action
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      // Record download count
      fetch(`/api/notes/${note.id}/download`, { method: 'POST' }).catch(console.error);

      if (primaryAttachment) {
        // Trigger download of attachment
        const a = document.createElement('a');
        a.href = primaryAttachment.url;
        a.download = primaryAttachment.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        success('Download Started', `Downloading ${primaryAttachment.name}`);
      } else if (note.content) {
        // Download markdown content as .md file
        const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        success('Downloaded Note', 'Saved as Markdown file');
      }
    } catch {
      error('Download Failed', 'Could not complete file download.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Share note link
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/notes/${note.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: `Check out these ${category.name} notes: ${note.title}`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      success('Link Copied!', 'Note URL copied to clipboard');
    } catch {
      error('Failed to copy', 'Could not copy link');
    }
  };

  // Delete note
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${note.title}"?`)) return;

    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
      if (res.ok) {
        success('Note Deleted', 'The note has been removed.');
        if (onDelete) onDelete(note.id);
      } else {
        error('Failed to delete', 'Action could not be completed.');
      }
    } catch {
      error('Network Error', 'Failed to communicate with server.');
    }
  };

  return (
    <article
      onClick={() => onPreview(note)}
      className="group relative flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xl dark:hover:shadow-indigo-950/20 transition-all duration-200 cursor-pointer"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Subject Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border uppercase tracking-wider ${category.badgeBg} ${category.badgeColor} ${category.badgeBorder}`}
            >
              {category.name}
            </span>

            {/* Pinned Badge */}
            {note.isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>Featured</span>
              </span>
            )}

            {/* Semester badge */}
            {note.semester && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {note.semester}
              </span>
            )}
          </div>

          {/* Quick File Type Badge */}
          {primaryAttachment && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase"
              title={`${primaryAttachment.name} (${formatBytes(primaryAttachment.size)})`}
            >
              {renderFileIcon()}
              <span>{primaryAttachment.extension}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug mb-2">
          {note.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {note.description}
        </p>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {note.tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800"
              >
                #{tag}
              </span>
            ))}
            {note.tags.length > 4 && (
              <span className="text-[10px] text-slate-400 self-center">
                +{note.tags.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer / Metadata & Actions */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
          {/* Author */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center font-bold text-[10px] text-indigo-600 dark:text-indigo-300 shrink-0">
              {note.authorName?.charAt(0).toUpperCase()}
            </div>
            <span className="truncate max-w-[110px] font-medium text-slate-700 dark:text-slate-300">
              {note.authorName}
            </span>
            {note.authorRole === 'admin' && (
              <span title="Administrator">
                <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              </span>
            )}
          </div>

          {/* Date */}
          <span className="shrink-0">{formatDate(note.createdAt)}</span>
        </div>

        {/* Interactive Action Bar */}
        <div className="flex items-center justify-between gap-1">
          {/* Counters: Views, Downloads, Likes */}
          <div className="flex items-center gap-3 text-xs">
            {/* Views */}
            <span className="flex items-center gap-1 text-slate-400" title="Views">
              <Eye className="w-3.5 h-3.5" />
              <span>{note.viewsCount || 0}</span>
            </span>

            {/* Downloads */}
            <span className="flex items-center gap-1 text-slate-400" title="Downloads">
              <Download className="w-3.5 h-3.5" />
              <span>{note.downloadsCount || 0}</span>
            </span>

            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 ${
                isLiked ? 'text-rose-500 font-semibold' : 'text-slate-400 hover:text-rose-500'
              }`}
              title="Like note"
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500' : ''}`} />
              <span>{likesCount}</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Share */}
            <button
              onClick={handleShare}
              className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Share link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Admin / Author Pin & Delete */}
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPinToggle) onPinToggle(note.id, !!note.isPinned);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  note.isPinned
                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={note.isPinned ? 'Unpin note' : 'Pin note to top (Admin)'}
              >
                <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-amber-500' : ''}`} />
              </button>
            )}

            {canModify && (
              <button
                onClick={handleDelete}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
