'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Grid, Plus, Search, User, ShieldCheck } from 'lucide-react';

interface MobileNavProps {
  onOpenUpload: () => void;
  onOpenSearch: () => void;
}

export default function MobileNav({ onOpenUpload, onOpenSearch }: MobileNavProps) {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
            pathname === '/' ? 'text-indigo-600 dark:text-cyan-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Feed</span>
        </Link>

        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="flex flex-col items-center gap-1 p-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 transition-colors"
        >
          <Search className="w-5 h-5" />
          <span>Search</span>
        </button>

        {/* Center Primary Upload Button */}
        <button
          onClick={onOpenUpload}
          className="-mt-5 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
          aria-label="Upload note"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Categories Shortcut */}
        <Link
          href="/#categories"
          className="flex flex-col items-center gap-1 p-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 transition-colors"
        >
          <Grid className="w-5 h-5" />
          <span>Subjects</span>
        </Link>

        {/* Admin or Profile */}
        {isAdmin ? (
          <Link
            href="/admin"
            className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
              pathname === '/admin' ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-amber-500/80'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Admin</span>
          </Link>
        ) : (
          <Link
            href={user ? '/?myNotes=true' : '/login'}
            className="flex flex-col items-center gap-1 p-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 transition-colors"
          >
            <User className="w-5 h-5" />
            <span>{user ? 'Account' : 'Sign In'}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
