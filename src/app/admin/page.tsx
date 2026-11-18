'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { User, Note, CategoryId, AdminStats, SystemSettings } from '@/lib/types';
import { CATEGORY_LIST, DEFAULT_ADMIN } from '@/lib/constants';
import { formatDate, formatBytes, getCategoryInfo } from '@/lib/utils';
import {
  ShieldCheck,
  Users,
  FileText,
  Download,
  Eye,
  UserPlus,
  Trash2,
  Key,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Layers,
  ArrowLeft,
  Search,
  Pin,
  ExternalLink,
  Shield,
  Loader2,
  X,
} from 'lucide-react';

export default function AdminPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'users' | 'notes' | 'settings'>('users');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Search filters
  const [userSearch, setUserSearch] = useState('');
  const [noteSearch, setNoteSearch] = useState('');

  // Modals
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'admin'>('student');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Reset Password Modal
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [resetPasswordNew, setResetPasswordNew] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Fetch admin dashboard data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, notesRes, settingsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/notes?sort=newest'),
        fetch('/api/admin/settings'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData.notes);
      }
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData.settings);
      }
    } catch {
      error('Failed to load dashboard', 'Could not retrieve administrative data.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        router.push('/login?redirect=/admin');
      } else {
        fetchData();
      }
    }
  }, [authLoading, isAdmin, router, fetchData]);

  // Handle User Registration by Admin
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      error('Missing fields', 'Please enter name, email, and password');
      return;
    }

    setIsSubmittingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        success('User Created Successfully', `Registered ${data.user.name} (${data.user.email})`);
        setShowCreateUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('student');
        fetchData();
      } else {
        error('Registration Failed', data.error || 'Failed to create user');
      }
    } catch {
      error('Network error', 'Failed to register user');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Toggle User Status (Suspend / Activate)
  const handleToggleStatus = async (targetUser: User) => {
    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        success('Status Updated', `${targetUser.name} is now ${nextStatus}`);
        setUsers(prev => prev.map(u => (u.id === targetUser.id ? { ...u, status: nextStatus } : u)));
      } else {
        const err = await res.json();
        error('Action Failed', err.error);
      }
    } catch {
      error('Network error', 'Failed to update user status');
    }
  };

  // Toggle User Role (Admin / Student)
  const handleToggleRole = async (targetUser: User) => {
    const nextRole = targetUser.role === 'admin' ? 'student' : 'admin';
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        success('Role Updated', `${targetUser.name} is now ${nextRole}`);
        setUsers(prev => prev.map(u => (u.id === targetUser.id ? { ...u, role: nextRole } : u)));
      } else {
        const err = await res.json();
        error('Action Failed', err.error);
      }
    } catch {
      error('Network error', 'Failed to update role');
    }
  };

  // Reset User Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUserId || !resetPasswordNew) return;
    setIsResettingPassword(true);

    try {
      const res = await fetch(`/api/admin/users/${resetPasswordUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetPasswordNew }),
      });
      if (res.ok) {
        success('Password Reset', 'New password updated successfully.');
        setResetPasswordUserId(null);
        setResetPasswordNew('');
      } else {
        const err = await res.json();
        error('Failed to Reset', err.error);
      }
    } catch {
      error('Network error', 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (targetUser: User) => {
    if (!confirm(`Are you sure you want to permanently delete ${targetUser.name}? All notes uploaded by this user will also be deleted.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, { method: 'DELETE' });
      if (res.ok) {
        success('User Deleted', `${targetUser.name} removed from system.`);
        fetchData();
      } else {
        const err = await res.json();
        error('Delete Failed', err.error);
      }
    } catch {
      error('Network error', 'Failed to delete user');
    }
  };

  // Delete Note as Admin
  const handleDeleteNote = async (noteId: string, noteTitle: string) => {
    if (!confirm(`Are you sure you want to delete note "${noteTitle}"?`)) return;

    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        success('Note Deleted', 'Note removed successfully.');
        setNotes(prev => prev.filter(n => n.id !== noteId));
      }
    } catch {
      error('Delete failed', 'Could not delete note.');
    }
  };

  // Pin Note as Admin
  const handleTogglePin = async (noteId: string, currentPinStatus: boolean) => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentPinStatus }),
      });
      if (res.ok) {
        const next = !currentPinStatus;
        success(next ? 'Note Featured' : 'Note Unpinned', 'Note status updated.');
        setNotes(prev => prev.map(n => (n.id === noteId ? { ...n, isPinned: next } : n)));
      }
    } catch {
      error('Failed to update pin', 'Could not toggle pinned status.');
    }
  };

  // Toggle Registration Setting
  const handleTogglePublicRegistration = async () => {
    if (!settings) return;
    const nextVal = !settings.allowPublicRegistration;

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowPublicRegistration: nextVal }),
      });
      if (res.ok) {
        setSettings(prev => (prev ? { ...prev, allowPublicRegistration: nextVal } : null));
        success(
          'Registration Policy Updated',
          nextVal
            ? 'Open Registration enabled: Anyone can register an account.'
            : 'Admin-Only Registration enabled: Only Admins can create user accounts.'
        );
      }
    } catch {
      error('Failed to update policy', 'Server error');
    }
  };

  if (authLoading || (loading && !stats)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500">Loading admin authority dashboard...</p>
      </div>
    );
  }

  // Filtered collections
  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q);
  });

  const filteredNotes = notes.filter(n => {
    const q = noteSearch.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.authorName.toLowerCase().includes(q) ||
      n.categoryId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full Authority</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Admin Management Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register students, manage system users, oversee subjects, and moderate notes across the platform.
          </p>
        </div>

        {/* Action Button: Register New User */}
        <button
          onClick={() => setShowCreateUserModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New User</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Notes */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Notes</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats?.totalNotes || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across 6 engineering subjects</p>
        </div>

        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Users</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats?.totalUsers || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Friends & students enrolled</p>
        </div>

        {/* Total Downloads */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Downloads</span>
            <Download className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats?.totalDownloads || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total document accesses</p>
        </div>

        {/* Total Views */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Note Views</span>
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {stats?.totalViews || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Portal visits & interactions</p>
        </div>
      </div>

      {/* 6 Category Breakdown Overview */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span>Subject Notes Distribution (6 Categories)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORY_LIST.map(cat => {
            const count = stats?.categoryBreakdown[cat.id] || 0;
            const pct = stats?.totalNotes ? Math.round((count / stats.totalNotes) * 100) : 0;
            return (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40"
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className={cat.badgeColor}>{cat.name}</span>
                  <span className="text-slate-900 dark:text-white">{count}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: cat.accentColor }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">{pct}% of library</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Registration ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === 'notes'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Content Moderation ({notes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>System Policies & Controls</span>
        </button>
      </div>

      {/* TAB 1: USERS & REGISTRATION */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* User Search & Top Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search users by name, email, role..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Showing {filteredUsers.length} users</span>
            </div>
          </div>

          {/* User List Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes Uploaded</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">{u.name}</p>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleRole(u)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                            u.role === 'admin'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                          title="Click to toggle Role"
                        >
                          <Shield className="w-3 h-3" />
                          <span>{u.role.toUpperCase()}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                            u.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}
                          title="Click to toggle Status"
                        >
                          {u.status === 'active' ? <Lock className="w-3 h-3 text-emerald-600" /> : <Unlock className="w-3 h-3 text-rose-600" />}
                          <span>{u.status === 'active' ? 'Active' : 'Suspended'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {u.notesCount ?? 0} notes
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reset Password Button */}
                          <button
                            onClick={() => {
                              setResetPasswordUserId(u.id);
                              setResetPasswordNew('');
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={user?.id === u.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTENT MODERATION */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={noteSearch}
                onChange={e => setNoteSearch(e.target.value)}
                placeholder="Search notes by title, author, category..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <span className="text-xs text-slate-500">{filteredNotes.length} notes listed</span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Note Title</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">Attachment</th>
                    <th className="py-3 px-4">Stats</th>
                    <th className="py-3 px-4 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredNotes.map(n => {
                    const cat = getCategoryInfo(n.categoryId);
                    return (
                      <tr key={n.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase ${cat.badgeBg} ${cat.badgeColor} ${cat.badgeBorder}`}
                          >
                            {cat.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {n.isPinned && <Pin className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />}
                            <span className="font-semibold text-slate-900 dark:text-white line-clamp-1">{n.title}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {n.authorName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                          {n.attachments?.[0] ? `${n.attachments[0].extension.toUpperCase()} (${formatBytes(n.attachments[0].size)})` : 'Markdown Text'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {n.viewsCount || 0} views • {n.downloadsCount || 0} dl
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleTogglePin(n.id, !!n.isPinned)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                n.isPinned
                                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                  : 'text-slate-400 hover:text-amber-500'
                              }`}
                              title={n.isPinned ? 'Unpin' : 'Pin to top of feed'}
                            >
                              <Pin className={`w-4 h-4 ${n.isPinned ? 'fill-amber-500' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(n.id, n.title)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete Note"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS & REGISTRATION POLICY */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          {/* Registration Mode Setting Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Registration Authority Policy
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Control whether only administrators can create new user accounts, or allow friends to self-register.
                </p>
              </div>
              <button
                onClick={handleTogglePublicRegistration}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings?.allowPublicRegistration ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings?.allowPublicRegistration ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Current Status:{' '}
                {settings?.allowPublicRegistration ? (
                  <span className="text-indigo-600 dark:text-indigo-400">
                    Open Registration (Anyone can register)
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    Admin-Only Registration (Exclusive Authority)
                  </span>
                )}
              </p>
              <p className="text-slate-500 mt-1">
                When Admin-Only Registration is active, visitors attempting to register will see an advisory prompt to contact the Administrator.
              </p>
            </div>
          </div>

          {/* Quick Admin Credentials Info Box */}
          <div className="p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Default Administrator Account</span>
            </div>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              Default Email: <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">{DEFAULT_ADMIN.email}</code>
            </p>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              Default Password: <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">{DEFAULT_ADMIN.password}</code>
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
              You can change your password anytime using the reset button in the Users table.
            </p>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW USER (ADMIN AUTHORITY) */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-cyan-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Register User / Friend
                </h3>
              </div>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Alex Hunter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="alex@college.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Password * (Min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Assigned Authority Role
                </label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as 'student' | 'admin')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="student">Student / Friend (Can read, upload, download, like)</option>
                  <option value="admin">Administrator (Full control, user management, moderation)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all disabled:opacity-60"
                >
                  {isSubmittingUser && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Register Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD (ADMIN) */}
      {resetPasswordUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-500" />
                <span>Reset User Password</span>
              </h3>
              <button
                onClick={() => setResetPasswordUserId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  New Password (Min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={resetPasswordNew}
                  onChange={e => setResetPasswordNew(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordUserId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-60"
                >
                  {isResettingPassword ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
