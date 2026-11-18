'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import CategoryBar from '@/components/CategoryBar';
import SearchAndFilter from '@/components/SearchAndFilter';
import NoteCard from '@/components/NoteCard';
import NoteUploadModal from '@/components/NoteUploadModal';
import NotePreviewModal from '@/components/NotePreviewModal';
import { Note, CategoryId } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import {
  UploadCloud,
  Sparkles,
  BookOpen,
  FolderOpen,
  Loader2,
  FileText,
  Search,
  Plus,
} from 'lucide-react';

function NotesFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const urlCategory = searchParams.get('category') || 'all';
  const urlSearch = searchParams.get('search') || '';
  const myNotesOnly = searchParams.get('myNotes') === 'true';

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [searchQuery, setSearchQuery] = useState<string>(urlSearch);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  // Category counts
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Sync category from URL param
  useEffect(() => {
    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [urlCategory]);

  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  // Fetch notes from API
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (sortBy) {
        params.append('sort', sortBy);
      }
      if (myNotesOnly && user) {
        params.append('authorId', user.id);
      }

      const res = await fetch(`/api/notes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);

        // Compute counts
        const allRes = await fetch('/api/notes');
        if (allRes.ok) {
          const allData = await allRes.json();
          const counts: Record<string, number> = {};
          (allData.notes as Note[]).forEach(n => {
            counts[n.categoryId] = (counts[n.categoryId] || 0) + 1;
          });
          setCategoryCounts(counts);
        }
      }
    } catch (err) {
      console.error('Failed to load notes', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy, myNotesOnly, user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Category change handler
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    const newParams = new URLSearchParams(searchParams.toString());
    if (catId === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', catId);
    }
    router.push(`/?${newParams.toString()}`);
  };

  // Search change handler
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const newParams = new URLSearchParams(searchParams.toString());
    if (query) {
      newParams.set('search', query);
    } else {
      newParams.delete('search');
    }
    router.push(`/?${newParams.toString()}`);
  };

  const handleNoteUploaded = (newNote: Note) => {
    setNotes(prev => [newNote, ...prev]);
    fetchNotes();
  };

  const handleNoteDeleted = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    if (previewNote?.id === noteId) {
      setPreviewNote(null);
    }
  };

  const activeCategoryInfo = selectedCategory !== 'all' ? CATEGORIES[selectedCategory as CategoryId] : undefined;

  return (
    <div className="flex-1 flex flex-col pb-20 sm:pb-12">
      {/* Top Navbar */}
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSearch={() => {
          window.scrollTo({ top: 220, behavior: 'smooth' });
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          searchInput?.focus();
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 sm:p-10 border border-indigo-900/60 shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Peer Notes & Study Material Repository</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Share Engineering Notes <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                in Any Format, Anywhere.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Curated notes, question banks, cheatsheets, and lab manuals organized across{' '}
              <strong className="text-white">DBMS</strong>, <strong className="text-white">OOPS</strong>,{' '}
              <strong className="text-white">DS</strong>, <strong className="text-white">DLCO</strong>,{' '}
              <strong className="text-white">DMS</strong>, and <strong className="text-white">Others</strong>. Upload PDFs, Word documents, images, code, or slides in seconds.
            </p>

            {/* Quick Hero Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-950 bg-white hover:bg-slate-100 shadow-lg active:scale-95 transition-all"
              >
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>Upload a Note</span>
              </button>

              <button
                onClick={() => handleSelectCategory('all')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Browse All Subjects</span>
              </button>
            </div>
          </div>

          {/* Decorative background glow */}
          <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute right-1/4 bottom-0 -mb-12 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        </section>

        {/* 6 Category Navigation Bar */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Engineering Subjects (6 Categories)
            </h2>
          </div>
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            categoryCounts={categoryCounts}
          />
        </section>

        {/* Search, Filter & Sort Controls */}
        <section>
          <SearchAndFilter
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            activeCategoryName={activeCategoryInfo?.name}
            onClearCategory={() => handleSelectCategory('all')}
            totalResults={notes.length}
          />
        </section>

        {/* Notes Grid / List */}
        <section className="min-h-[40vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs text-slate-500">Loading notes catalog...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-cyan-400 flex items-center justify-center mb-3">
                <FolderOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No notes found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-5">
                {searchQuery
                  ? `No study materials matched "${searchQuery}". Try different keywords.`
                  : activeCategoryInfo
                  ? `No notes uploaded yet for ${activeCategoryInfo.fullName}. Be the first to share!`
                  : 'Be the first one to share your notes with friends!'}
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Note Now</span>
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
                  : 'flex flex-col gap-3'
              }
            >
              {notes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onPreview={n => setPreviewNote(n)}
                  onDelete={handleNoteDeleted}
                  onPinToggle={async (id, currentPin) => {
                    const res = await fetch(`/api/notes/${id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ isPinned: !currentPin }),
                    });
                    if (res.ok) fetchNotes();
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Upload Note Modal */}
      <NoteUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleNoteUploaded}
        defaultCategory={
          selectedCategory !== 'all' ? (selectedCategory as CategoryId) : 'dbms'
        }
      />

      {/* Note Preview & Detail Modal */}
      <NotePreviewModal
        note={previewNote}
        isOpen={!!previewNote}
        onClose={() => setPreviewNote(null)}
      />

      {/* Mobile Bottom Dock Navigation */}
      <MobileNav
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSearch={() => {
          window.scrollTo({ top: 220, behavior: 'smooth' });
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          searchInput?.focus();
        }}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <NotesFeed />
    </Suspense>
  );
}
