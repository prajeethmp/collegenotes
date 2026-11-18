'use client';

import React, { useState } from 'react';
import { Note, NoteAttachment } from '@/lib/types';
import { getCategoryInfo, formatBytes, formatDate, getFileTypeCategory } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import {
  X,
  Download,
  Share2,
  Heart,
  Eye,
  FileText,
  Calendar,
  User,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface NotePreviewModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onLikeChange?: (noteId: string, count: number, liked: boolean) => void;
}

export default function NotePreviewModal({
  note,
  isOpen,
  onClose,
  onLikeChange,
}: NotePreviewModalProps) {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [copied, setCopied] = useState(false);
  const [likesCount, setLikesCount] = useState(note?.likesCount || 0);
  const [isLiked, setIsLiked] = useState(user && note ? note.likedBy?.includes(user.id) : false);

  if (!isOpen || !note) return null;

  const category = getCategoryInfo(note.categoryId);
  const primaryAttachment: NoteAttachment | undefined = note.attachments?.[0];
  const fileCategory = primaryAttachment ? getFileTypeCategory(primaryAttachment.extension) : 'other';

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

  const handleCopyText = () => {
    if (note.content) {
      navigator.clipboard.writeText(note.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      success('Copied Content', 'Note text copied to clipboard');
    }
  };

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/notes/${note.id}/like`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.liked);
        setLikesCount(data.count);
        if (onLikeChange) onLikeChange(note.id, data.count, data.liked);
      }
    } catch {
      // Ignore
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/notes/${note.id}`;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border uppercase tracking-wider ${category.badgeBg} ${category.badgeColor} ${category.badgeBorder}`}
              >
                {category.name}
              </span>
              {note.semester && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {note.semester}
                </span>
              )}
              {primaryAttachment && (
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-400 uppercase">
                  {primaryAttachment.extension} ({formatBytes(primaryAttachment.size)})
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
              {note.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* File Viewer if Attachment exists */}
          {primaryAttachment && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950">
              {/* PDF Viewer */}
              {fileCategory === 'pdf' ? (
                <div className="w-full h-[55vh] flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {primaryAttachment.name}
                    </span>
                    <a
                      href={primaryAttachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-600 dark:text-cyan-400 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Full Window</span>
                    </a>
                  </div>
                  <iframe
                    src={`${primaryAttachment.url}#view=FitH`}
                    className="w-full flex-1 border-0"
                    title={primaryAttachment.name}
                  />
                </div>
              ) : fileCategory === 'image' ? (
                /* Image Viewer */
                <div className="flex items-center justify-center p-4 max-h-[55vh] overflow-hidden">
                  <img
                    src={primaryAttachment.url}
                    alt={note.title}
                    className="max-h-[50vh] max-w-full rounded-xl object-contain shadow-md"
                  />
                </div>
              ) : (
                /* Other format card (DOCX, PPTX, ZIP, Code) */
                <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-cyan-400 flex items-center justify-center shadow-inner">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {primaryAttachment.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {primaryAttachment.extension.toUpperCase()} document • {formatBytes(primaryAttachment.size)}
                    </p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File ({formatBytes(primaryAttachment.size)})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Note Description */}
          {note.description && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                About this Note
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {note.description}
              </p>
            </div>
          )}

          {/* Typed Content / Markdown Preview */}
          {note.content && (
            <div className="relative rounded-2xl bg-slate-50 dark:bg-slate-950 p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Notes Content
                </span>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
              <pre className="text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                {note.content}
              </pre>
            </div>
          )}

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {note.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Metadata Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-500" />
                <span>Uploaded by <strong className="text-slate-700 dark:text-slate-300">{note.authorName}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{formatDate(note.createdAt)}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{note.viewsCount || 0} views</span>
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                <span>{note.downloadsCount || 0} downloads</span>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
              isLiked
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border-rose-200 dark:border-rose-800'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-rose-50 hover:text-rose-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
            <span>{isLiked ? 'Liked' : 'Like'} ({likesCount})</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Note</span>
          </button>
        </div>
      </div>
    </div>
  );
}
