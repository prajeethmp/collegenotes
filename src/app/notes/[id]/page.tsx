'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Note, NoteAttachment } from '@/lib/types';
import { getCategoryInfo, formatBytes, formatDate, getFileTypeCategory } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import {
  ArrowLeft,
  Download,
  Share2,
  Heart,
  Eye,
  Calendar,
  User,
  FileText,
  ExternalLink,
  Shield,
  Loader2,
  Copy,
  Check,
  Pin,
  Trash2,
} from 'lucide-react';


function NoteDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    async function loadNote() {
      try {
        setLoading(true);
        const res = await fetch(`/api/notes/${id}`);
        if (!res.ok) {
          throw new Error('Note not found');
        }
        const data = await res.json();
        setNote(data.note);
        setLikesCount(data.note.likesCount || 0);
        if (user) {
          setIsLiked(data.note.likedBy?.includes(user.id));
        }
      } catch {
        error('Note Not Found', 'Could not locate this note.');
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    loadNote();
  }, [id, user, router, error]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500">Loading note details...</p>
      </div>
    );
  }

  if (!note) return null;

  const category = getCategoryInfo(note.categoryId);
  const primaryAttachment: NoteAttachment | undefined = note.attachments?.[0];
  const fileCategory = primaryAttachment ? getFileTypeCategory(primaryAttachment.extension) : 'other';
  const canModify = user && (user.role === 'admin' || user.id === note.authorId);

  const handleDownload = () => {
    fetch(`/api/notes/${note.id}/download`, { method: 'POST' }).catch(console.error);

    if (primaryAttachment) {
      const a = document.createElement('a');
      a.href = primaryAttachment.url;
      a.download = primaryAttachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      success('Download Started', `Downloading ${primaryAttachment.name}`);
    } else if (note.content) {
      const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Downloaded Note', 'Saved as Markdown');
    }
  };

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/notes/${note.id}/like`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.liked);
        setLikesCount(data.count);
      }
    } catch {
      // Ignore
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title,
          text: note.description,
          url,
        });
        return;
      } catch {
        // Fallback
      }
    }
    navigator.clipboard.writeText(url);
    success('Link Copied', 'URL copied to clipboard');
  };

  const handleCopyText = () => {
    if (note.content) {
      navigator.clipboard.writeText(note.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      success('Content Copied', 'Note text copied to clipboard');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${note.title}"?`)) return;
    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: 'DELETE' });
      if (res.ok) {
        success('Note Deleted', 'The note has been removed.');
        router.push('/');
      }
    } catch {
      error('Delete Failed', 'Could not delete note.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/?category=${note.categoryId}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {category.name} Notes</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {canModify && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete Note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Note Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border uppercase tracking-wider ${category.badgeBg} ${category.badgeColor} ${category.badgeBorder}`}
          >
            {category.name} • {category.fullName}
          </span>

          {note.isPinned && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Pin className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Featured Note</span>
            </span>
          )}

          {note.semester && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {note.semester}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {note.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {note.description}
        </p>

        {/* Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center font-bold text-xs text-indigo-700 dark:text-indigo-300">
                {note.authorName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">{note.authorName}</span>
                {note.authorRole === 'admin' && (
                  <span className="ml-1 text-[10px] uppercase font-bold text-amber-600">Admin</span>
                )}
              </div>
            </div>

            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{formatDate(note.createdAt)}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isLiked
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border-rose-200 dark:border-rose-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-rose-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
              <span>{likesCount} Likes</span>
            </button>

            <span className="flex items-center gap-1 text-slate-400">
              <Eye className="w-4 h-4" />
              <span>{note.viewsCount || 0} views</span>
            </span>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Preview Container */}
      {primaryAttachment && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-lg">
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {primaryAttachment.name}
              </span>
              <span className="text-[11px] text-slate-400 shrink-0">
                ({formatBytes(primaryAttachment.size)})
              </span>
            </div>

            <a
              href={primaryAttachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-cyan-400 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Raw File</span>
            </a>
          </div>

          {fileCategory === 'pdf' ? (
            <div className="w-full h-[75vh]">
              <iframe
                src={`${primaryAttachment.url}#view=FitH`}
                className="w-full h-full border-0"
                title={primaryAttachment.name}
              />
            </div>
          ) : fileCategory === 'image' ? (
            <div className="flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-950">
              <img
                src={primaryAttachment.url}
                alt={note.title}
                className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-md"
              />
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-cyan-400 flex items-center justify-center">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {primaryAttachment.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Format: {primaryAttachment.extension.toUpperCase()} • Size: {formatBytes(primaryAttachment.size)}
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download Attachment</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Typed Content / Markdown Section */}
      {note.content && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Lecture Notes / Summary Content
            </h3>
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-cyan-400 hover:underline"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>
          <pre className="text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {note.content}
          </pre>
        </div>
      )}

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Subject Tags:</span>
          {note.tags.map((t, idx) => (
            <Link
              key={idx}
              href={`/?search=${encodeURIComponent(t)}`}
              className="text-xs font-medium px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 transition-colors"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface NoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading note details...</p>
        </div>
      }
    >
      <NoteDetailContent id={id} />
    </Suspense>
  );
}
