'use client';

import React from 'react';
import { CategoryId } from '@/lib/types';
import { CATEGORY_LIST } from '@/lib/constants';
import { Database, Boxes, Network, Cpu, Binary, FolderArchive, Layers } from 'lucide-react';

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts?: Record<string, number>;
}

const ICONS: Record<string, React.ElementType> = {
  dbms: Database,
  oops: Boxes,
  ds: Network,
  dlco: Cpu,
  dms: Binary,
  others: FolderArchive,
};

export default function CategoryBar({
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
}: CategoryBarProps) {
  const totalNotes = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  return (
    <div id="categories" className="w-full">
      {/* Scrollable pill container */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
        {/* All Notes Button */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`shrink-0 snap-start flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-transparent shadow-md'
              : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Subjects</span>
          {totalNotes > 0 && (
            <span
              className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'all'
                  ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {totalNotes}
            </span>
          )}
        </button>

        {/* 6 Subject Pills */}
        {CATEGORY_LIST.map(cat => {
          const Icon = ICONS[cat.id] || FolderArchive;
          const isSelected = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 snap-start flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                isSelected
                  ? `${cat.badgeBg} ${cat.badgeColor} ${cat.badgeBorder} shadow-sm ring-2 ring-indigo-500/20`
                  : 'bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{cat.name}</span>
              {count > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-black/10 dark:bg-white/10'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
