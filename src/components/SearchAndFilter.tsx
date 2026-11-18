'use client';

import React, { useRef, useEffect } from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown, LayoutGrid, List } from 'lucide-react';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  activeCategoryName?: string;
  onClearCategory?: () => void;
  totalResults: number;
}

export default function SearchAndFilter({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  activeCategoryName,
  onClearCategory,
  totalResults,
}: SearchAndFilterProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: '/' or 'Ctrl+K' focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k') || (e.metaKey && e.key === 'k')) && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search notes by title, topic, tags, or author... (Press / to focus)"
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-2.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort & View toggles */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Sort Dropdown */}
          <div className="relative flex items-center">
            <select
              value={sortBy}
              onChange={e => onSortChange(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
            >
              <option value="newest">Newest First</option>
              <option value="downloads">Most Downloaded</option>
              <option value="views">Most Viewed</option>
              <option value="likes">Most Liked</option>
              <option value="alpha">Alphabetical (A-Z)</option>
              <option value="oldest">Oldest First</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          </div>

          {/* Grid / List toggle (desktop) */}
          <div className="hidden sm:flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-cyan-400'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-cyan-400'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips & Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2 flex-wrap">
          <span>Found <strong>{totalResults}</strong> {totalResults === 1 ? 'note' : 'notes'}</span>

          {activeCategoryName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-cyan-300 font-medium">
              <span>Category: {activeCategoryName}</span>
              {onClearCategory && (
                <button onClick={onClearCategory} className="hover:text-rose-500">
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              <span>Query: &quot;{searchQuery}&quot;</span>
              <button onClick={() => onSearchChange('')} className="hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
