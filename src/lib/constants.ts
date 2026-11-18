import { CategoryId, CategoryInfo } from './types';

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  dbms: {
    id: 'dbms',
    name: 'DBMS',
    fullName: 'Database Management Systems',
    description: 'Relational models, SQL, Normalization, Transactions, ACID, Indexing & NoSQL',
    iconName: 'Database',
    badgeColor: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    accentColor: '#10b981',
  },
  oops: {
    id: 'oops',
    name: 'OOPS',
    fullName: 'Object-Oriented Programming',
    description: 'Classes, Objects, Inheritance, Polymorphism, Abstraction & Design Patterns in Java/C++',
    iconName: 'Boxes',
    badgeColor: 'text-indigo-700 dark:text-indigo-300',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
    accentColor: '#6366f1',
  },
  ds: {
    id: 'ds',
    name: 'DS',
    fullName: 'Data Structures & Algorithms',
    description: 'Arrays, Linked Lists, Trees, Graphs, Sorting, Hash Maps & Dynamic Programming',
    iconName: 'Network',
    badgeColor: 'text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    accentColor: '#f59e0b',
  },
  dlco: {
    id: 'dlco',
    name: 'DLCO',
    fullName: 'Digital Logic & Computer Organization',
    description: 'Logic Gates, Boolean Algebra, K-Maps, CPU Architecture, ALUs & Memory Systems',
    iconName: 'Cpu',
    badgeColor: 'text-rose-700 dark:text-rose-300',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
    badgeBorder: 'border-rose-200 dark:border-rose-800',
    accentColor: '#f43f5e',
  },
  dms: {
    id: 'dms',
    name: 'DMS',
    fullName: 'Discrete Mathematical Structures',
    description: 'Set Theory, Relations, Graph Theory, Propositional Logic & Combinatorics',
    iconName: 'Binary',
    badgeColor: 'text-cyan-700 dark:text-cyan-300',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/60',
    badgeBorder: 'border-cyan-200 dark:border-cyan-800',
    accentColor: '#06b6d4',
  },
  others: {
    id: 'others',
    name: 'Others',
    fullName: 'General & Other Subjects',
    description: 'Operating Systems, Computer Networks, Mathematics, Lab Manuals, Cheatsheets & Guides',
    iconName: 'FolderArchive',
    badgeColor: 'text-purple-700 dark:text-purple-300',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/60',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
    accentColor: '#a855f7',
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

export const DEFAULT_ADMIN = {
  email: 'admin@notes.local',
  password: 'Admin@12345',
  name: 'Platform Administrator',
};

export const MAX_UPLOAD_SIZE = 25 * 1024 * 1024; // 25 MB

export const FILE_EXTENSIONS = {
  pdf: ['pdf'],
  image: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'],
  doc: ['doc', 'docx', 'odt'],
  presentation: ['ppt', 'pptx'],
  sheet: ['xls', 'xlsx', 'csv'],
  code: ['py', 'java', 'cpp', 'c', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'sql', 'sh', 'rb', 'go', 'rs'],
  text: ['txt', 'md', 'markdown'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz'],
};
