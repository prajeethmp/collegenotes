import { MongoClient, Db } from 'mongodb';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { UserWithPassword, Note, SystemSettings, CategoryId, AdminStats, User } from './types';
import { DEFAULT_ADMIN } from './constants';

interface DatabaseSchema {
  users: UserWithPassword[];
  notes: Note[];
  settings: SystemSettings;
}

const DEFAULT_SETTINGS: SystemSettings = {
  allowPublicRegistration: false, // Admin has all authority by default
  maxUploadSizeBytes: 25 * 1024 * 1024,
  defaultAdminCreated: true,
  siteName: 'StudyNexus',
  siteTagline: 'Engineering Notes & Study Material Repository',
};

// Seed demo notes for each of the 6 categories
function getInitialNotes(): Note[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'note_dbms_1',
      title: 'Complete SQL & Relational Algebra Master Cheatsheet',
      description: 'Comprehensive guide covering DDL, DML, Joins (Inner, Left, Right, Full Outer), Aggregate functions, Group By, Having, and Relational Algebra expressions.',
      content: `# Complete SQL & Relational Algebra Master Guide

## 1. Relational Algebra Fundamentals
* **Selection (σ)**: Filters rows satisfying condition -> $\\sigma_{age > 20}(Students)$
* **Projection (π)**: Selects specific columns -> $\\pi_{name, roll}(Students)$
* **Cartesian Product (×)**: Combines all rows from two relations
* **Natural Join (⋈)**: Combines tables on common attributes

## 2. SQL Normalization (1NF to BCNF)
- **1NF**: Atomic values only, no repeating groups.
- **2NF**: In 1NF and no partial dependencies (every non-prime attribute fully functionally dependent on primary key).
- **3NF**: In 2NF and no transitive dependencies ($X \\to Y, Y \\to Z$).
- **BCNF**: For every functional dependency $X \\to Y$, $X$ must be a super key.

## 3. Transaction ACID Properties
- **Atomicity**: All or nothing execution (WAL / Undo logs).
- **Consistency**: Preserves database invariants before and after transaction.
- **Isolation**: Concurrent transactions do not interfere (2PL, Snapshot Isolation).
- **Durability**: Committed data persists across system crashes (Redo logs).`,
      categoryId: 'dbms',
      tags: ['sql', 'normalization', 'acid', 'joins', 'cheatsheet'],
      semester: 'Sem 4',
      authorId: 'admin_root',
      authorName: 'Prof. Admin',
      authorRole: 'admin',
      attachments: [],
      viewsCount: 142,
      downloadsCount: 58,
      likesCount: 24,
      likedBy: [],
      isPinned: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: now,
    },
    {
      id: 'note_oops_1',
      title: 'OOP Design Patterns & SOLID Principles (C++ / Java)',
      description: 'Factory, Singleton, Observer, Strategy patterns with class diagrams, code examples, and in-depth breakdown of SOLID design principles.',
      content: `# Object-Oriented Programming & SOLID Principles

### S - Single Responsibility Principle
A class should have only one reason to change. Separate business logic from logging/persistence.

### O - Open/Closed Principle
Open for extension, closed for modification. Use interfaces and polymorphism.

### L - Liskov Substitution Principle
Subtypes must be substitutable for their base types without altering program correctness.

### I - Interface Segregation Principle
Clients should not be forced to depend on interfaces they do not use. Split fat interfaces.

### D - Dependency Inversion Principle
High-level modules should not depend on low-level modules. Both should depend on abstractions.`,
      categoryId: 'oops',
      tags: ['solid', 'design-patterns', 'java', 'cpp', 'polymorphism'],
      semester: 'Sem 3',
      authorId: 'admin_root',
      authorName: 'Prof. Admin',
      authorRole: 'admin',
      attachments: [],
      viewsCount: 98,
      downloadsCount: 42,
      likesCount: 19,
      likedBy: [],
      isPinned: true,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: now,
    },
    {
      id: 'note_ds_1',
      title: 'Data Structures Hand-Written Revision Notes: Trees & Graphs',
      description: 'Complete traversal algorithms (Inorder, Preorder, Postorder, Level-order), AVL Tree balancing rotations, Dijkstra algorithm, and Bellman-Ford comparisons.',
      content: `# Trees & Graphs Quick Reference

### Binary Search Tree Traversal
* **In-order (Left, Root, Right)**: Yields elements in ascending sorted order for BST.
* **Pre-order (Root, Left, Right)**: Used for serialization/copying tree.
* **Post-order (Left, Right, Root)**: Used for deleting nodes, bottom-up calculations.

### AVL Tree Balance Factor
$$BF(node) = Height(LeftSubtree) - Height(RightSubtree)$$
Valid values: $\\{-1, 0, 1\\}$. Rotations: LL, RR, LR, RL.

### Graph Shortest Path
* **Dijkstra**: Single-source, non-negative edge weights. Time: $O((V + E) \\log V)$ using Min-Heap.
* **Bellman-Ford**: Handles negative weights and detects negative cycles. Time: $O(V \\times E)$.`,
      categoryId: 'ds',
      tags: ['trees', 'avl', 'graphs', 'dijkstra', 'algorithms'],
      semester: 'Sem 3',
      authorId: 'admin_root',
      authorName: 'Prof. Admin',
      authorRole: 'admin',
      attachments: [],
      viewsCount: 215,
      downloadsCount: 89,
      likesCount: 37,
      likedBy: [],
      isPinned: true,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: now,
    },
    {
      id: 'note_dlco_1',
      title: 'Digital Logic & Computer Organization: K-Maps to Pipelining',
      description: '4-variable Karnaugh Maps, Multiplexers, Booth Multiplier, IEEE 754 Floating point, and 5-stage RISC instruction pipeline with hazard resolutions.',
      content: `# Digital Logic & Computer Organization (DLCO)

### 1. Karnaugh Map (K-Map) Minimization
- Gray code ordering: 00, 01, 11, 10
- Grouping rules: Groups must be powers of 2 (1, 2, 4, 8, 16)
- Wrap-around grouping allowed (corners and edges)

### 2. Five-Stage RISC Pipeline
1. **IF**: Instruction Fetch from Instruction Memory
2. **ID**: Instruction Decode & Register Fetch
3. **EX**: Execute / ALU Address Calculation
4. **MEM**: Memory Access (Read/Write)
5. **WB**: Write-Back result to Register File

### 3. Pipeline Hazards
* **Structural**: Resource conflict (solve with separate instruction & data caches)
* **Data**: Dependency on previous result (solve with forwarding/bypassing or stalling)
* **Control**: Branch instructions (solve with branch prediction / branch delay slots)`,
      categoryId: 'dlco',
      tags: ['k-maps', 'pipelining', 'risc', 'boolean-algebra', 'cpu'],
      semester: 'Sem 4',
      authorId: 'admin_root',
      authorName: 'Prof. Admin',
      authorRole: 'admin',
      attachments: [],
      viewsCount: 167,
      downloadsCount: 64,
      likesCount: 28,
      likedBy: [],
      isPinned: false,
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      updatedAt: now,
    },
    {
      id: 'note_dms_1',
      title: 'Discrete Mathematical Structures: Logic, Relations & Graph Theory',
      description: 'Truth tables, Equivalence relations, Posets, Hasse diagrams, Lattices, Euler formula for planar graphs, and Pigeonhole principle applications.',
      content: `# Discrete Mathematical Structures (DMS)

### 1. Propositional Equivalence Laws
- **De Morgan's**: $\\neg(p \\land q) \\equiv \\neg p \\lor \\neg q$
- **Contrapositive**: $p \\to q \\equiv \\neg q \\to \\neg p$

### 2. Relations Properties
- **Reflexive**: $\\forall a, (a, a) \\in R$
- **Symmetric**: $(a, b) \\in R \\implies (b, a) \\in R$
- **Transitive**: $(a, b) \\in R \\land (b, c) \\in R \\implies (a, c) \\in R$
- **Equivalence Relation**: Reflexive + Symmetric + Transitive.
- **Partial Order (POSET)**: Reflexive + Anti-Symmetric + Transitive.

### 3. Graph Theory Invariants
- **Handshaking Lemma**: $\\sum_{v \\in V} \\deg(v) = 2|E|$
- **Euler planar formula**: $V - E + F = 2$`,
      categoryId: 'dms',
      tags: ['logic', 'relations', 'poset', 'graphs', 'hasse-diagram'],
      semester: 'Sem 3',
      authorId: 'admin_root',
      authorName: 'Prof. Admin',
      authorRole: 'admin',
      attachments: [],
      viewsCount: 133,
      downloadsCount: 45,
      likesCount: 22,
      likedBy: [],
      isPinned: false,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      updatedAt: now,
    },
    {
      id: 'note_others_1',
      title: 'Operating Systems: Process Synchronization & Deadlocks',
      description: 'Semaphores, Monitors, Producer-Consumer problem, Dining Philosophers, Banker algorithm for Deadlock avoidance, and Page replacement algorithms.',
      content: `# Operating Systems: Concurrency & Deadlocks

### 1. Four Coffman Conditions for Deadlock
1. **Mutual Exclusion**: At least one resource held in non-shareable mode.
2. **Hold and Wait**: Process holding resources requests additional resources.
3. **No Preemption**: Resources cannot be preempted; must be released voluntarily.
4. **Circular Wait**: Closed chain of processes where each waits for resource held by next.

### 2. Banker's Algorithm Data Structures
* $Available[m]$: Available resources of each type.
* $Max[n][m]$: Maximum demand of each process.
* $Allocation[n][m]$: Currently allocated resources.
* $Need[n][m] = Max[n][m] - Allocation[n][m]$.`,
      categoryId: 'others',
      tags: ['operating-systems', 'deadlocks', 'semaphores', 'bankers-algorithm'],
      semester: 'Sem 4',
      authorId: 'admin_root',
      authorName: 'Prof. Admin',
      authorRole: 'admin',
      attachments: [],
      viewsCount: 180,
      downloadsCount: 71,
      likesCount: 31,
      likedBy: [],
      isPinned: false,
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
      updatedAt: now,
    },
  ];
}

// Memory / File Database implementation for zero-config local dev & serverless fallback
class JsonDatabase {
  private filePath: string;
  private memoryCache: DatabaseSchema | null = null;

  constructor() {
    // In serverless/Vercel without MongoDB, use /tmp or data dir
    const isVercel = !!process.env.VERCEL;
    const baseDir = isVercel ? '/tmp' : path.join(process.cwd(), 'data');
    if (!fs.existsSync(baseDir)) {
      try {
        fs.mkdirSync(baseDir, { recursive: true });
      } catch {
        // Fallback to in-memory if filesystem is read-only
      }
    }
    this.filePath = path.join(baseDir, 'notes_db.json');
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (this.memoryCache) return;

    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.memoryCache = JSON.parse(raw);
        return;
      }
    } catch {
      // Continue to seed if file read fails
    }

    // Seed admin & initial notes
    const passwordHash = bcrypt.hashSync(DEFAULT_ADMIN.password, 10);
    const initialAdmin: UserWithPassword = {
      id: 'admin_root',
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      role: 'admin',
      status: 'active',
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notesCount: 6,
    };

    this.memoryCache = {
      users: [initialAdmin],
      notes: getInitialNotes(),
      settings: DEFAULT_SETTINGS,
    };

    this.save();
  }

  private save() {
    if (!this.memoryCache) return;
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.memoryCache, null, 2), 'utf-8');
    } catch {
      // If filesystem write fails on edge, memory cache persists for the process lifetime
    }
  }

  async getUsers(): Promise<User[]> {
    this.ensureInitialized();
    return (this.memoryCache?.users || []).map(({ passwordHash: _, ...user }) => ({
      ...user,
      notesCount: (this.memoryCache?.notes || []).filter(n => n.authorId === user.id).length,
    }));
  }

  async getUserById(id: string): Promise<User | null> {
    this.ensureInitialized();
    const user = this.memoryCache?.users.find(u => u.id === id);
    if (!user) return null;
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async getUserByEmail(email: string): Promise<UserWithPassword | null> {
    this.ensureInitialized();
    const user = this.memoryCache?.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user || null;
  }

  async createUser(user: UserWithPassword): Promise<User> {
    this.ensureInitialized();
    this.memoryCache?.users.push(user);
    this.save();
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async updateUser(id: string, updates: Partial<UserWithPassword>): Promise<User | null> {
    this.ensureInitialized();
    const index = this.memoryCache?.users.findIndex(u => u.id === id) ?? -1;
    if (index === -1 || !this.memoryCache) return null;

    this.memoryCache.users[index] = {
      ...this.memoryCache.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    const { passwordHash: _, ...safeUser } = this.memoryCache.users[index];
    return safeUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    this.ensureInitialized();
    if (!this.memoryCache) return false;
    this.memoryCache.users = this.memoryCache.users.filter(u => u.id !== id);
    // Also remove their notes
    this.memoryCache.notes = this.memoryCache.notes.filter(n => n.authorId !== id);
    this.save();
    return true;
  }

  async getNotes(filters?: {
    category?: string;
    search?: string;
    sort?: string;
    authorId?: string;
  }): Promise<Note[]> {
    this.ensureInitialized();
    let notes = [...(this.memoryCache?.notes || [])];

    // Filter by Category
    if (filters?.category && filters.category !== 'all') {
      notes = notes.filter(n => n.categoryId.toLowerCase() === filters.category?.toLowerCase());
    }

    // Filter by Author
    if (filters?.authorId) {
      notes = notes.filter(n => n.authorId === filters.authorId);
    }

    // Filter by Search (query in title, description, content, or tags)
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      notes = notes.filter(n => {
        return (
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.authorName.toLowerCase().includes(q) ||
          n.tags.some(t => t.toLowerCase().includes(q)) ||
          (n.content && n.content.toLowerCase().includes(q))
        );
      });
    }

    // Sort
    notes.sort((a, b) => {
      // Pinned notes always surface first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      switch (filters?.sort) {
        case 'downloads':
          return b.downloadsCount - a.downloadsCount;
        case 'views':
          return b.viewsCount - a.viewsCount;
        case 'likes':
          return b.likesCount - a.likesCount;
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'alpha':
          return a.title.localeCompare(b.title);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return notes;
  }

  async getNoteById(id: string): Promise<Note | null> {
    this.ensureInitialized();
    return this.memoryCache?.notes.find(n => n.id === id) || null;
  }

  async createNote(note: Note): Promise<Note> {
    this.ensureInitialized();
    this.memoryCache?.notes.unshift(note);
    this.save();
    return note;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
    this.ensureInitialized();
    const index = this.memoryCache?.notes.findIndex(n => n.id === id) ?? -1;
    if (index === -1 || !this.memoryCache) return null;

    this.memoryCache.notes[index] = {
      ...this.memoryCache.notes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.memoryCache.notes[index];
  }

  async deleteNote(id: string): Promise<boolean> {
    this.ensureInitialized();
    if (!this.memoryCache) return false;
    const initialLength = this.memoryCache.notes.length;
    this.memoryCache.notes = this.memoryCache.notes.filter(n => n.id !== id);
    this.save();
    return this.memoryCache.notes.length < initialLength;
  }

  async incrementNoteViews(id: string): Promise<void> {
    this.ensureInitialized();
    const note = this.memoryCache?.notes.find(n => n.id === id);
    if (note) {
      note.viewsCount = (note.viewsCount || 0) + 1;
      this.save();
    }
  }

  async incrementNoteDownloads(id: string): Promise<void> {
    this.ensureInitialized();
    const note = this.memoryCache?.notes.find(n => n.id === id);
    if (note) {
      note.downloadsCount = (note.downloadsCount || 0) + 1;
      this.save();
    }
  }

  async toggleNoteLike(id: string, userId: string): Promise<{ liked: boolean; count: number }> {
    this.ensureInitialized();
    const note = this.memoryCache?.notes.find(n => n.id === id);
    if (!note) return { liked: false, count: 0 };

    if (!note.likedBy) note.likedBy = [];
    const idx = note.likedBy.indexOf(userId);
    let liked = false;
    if (idx > -1) {
      note.likedBy.splice(idx, 1);
      liked = false;
    } else {
      note.likedBy.push(userId);
      liked = true;
    }
    note.likesCount = note.likedBy.length;
    this.save();
    return { liked, count: note.likesCount };
  }

  async getSettings(): Promise<SystemSettings> {
    this.ensureInitialized();
    return this.memoryCache?.settings || DEFAULT_SETTINGS;
  }

  async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    this.ensureInitialized();
    if (!this.memoryCache) return DEFAULT_SETTINGS;
    this.memoryCache.settings = { ...this.memoryCache.settings, ...updates };
    this.save();
    return this.memoryCache.settings;
  }

  async getAdminStats(): Promise<AdminStats> {
    this.ensureInitialized();
    const notes = this.memoryCache?.notes || [];
    const users = this.memoryCache?.users || [];

    const categoryBreakdown: Record<CategoryId, number> = {
      dbms: 0,
      oops: 0,
      ds: 0,
      dlco: 0,
      dms: 0,
      others: 0,
    };

    let totalDownloads = 0;
    let totalViews = 0;

    for (const note of notes) {
      if (categoryBreakdown[note.categoryId] !== undefined) {
        categoryBreakdown[note.categoryId]++;
      }
      totalDownloads += note.downloadsCount || 0;
      totalViews += note.viewsCount || 0;
    }

    return {
      totalNotes: notes.length,
      totalUsers: users.length,
      totalDownloads,
      totalViews,
      categoryBreakdown,
      recentNotes: notes.slice(0, 5),
      recentUsers: users.slice(0, 5).map(({ passwordHash: _, ...u }) => u),
    };
  }
}

// MongoDB Implementation if MONGODB_URI is provided
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

async function getMongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  if (mongoDb) return mongoDb;

  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(uri);
      await mongoClient.connect();
    }
    mongoDb = mongoClient.db(process.env.MONGODB_DB_NAME || 'studynexus');
    
    // Seed initial admin if needed
    const usersCol = mongoDb.collection('users');
    const adminExists = await usersCol.findOne({ email: DEFAULT_ADMIN.email });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
      await usersCol.insertOne({
        id: 'admin_root',
        name: DEFAULT_ADMIN.name,
        email: DEFAULT_ADMIN.email,
        role: 'admin',
        status: 'active',
        passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Seed initial notes
      const notesCol = mongoDb.collection('notes');
      const count = await notesCol.countDocuments();
      if (count === 0) {
        await notesCol.insertMany(getInitialNotes());
      }
    }
    return mongoDb;
  } catch (err) {
    console.warn('MongoDB connection failed, falling back to JSON storage:', err);
    return null;
  }
}

// Unified Database Facade: transparently chooses MongoDB if configured, else JsonDatabase
const jsonDb = new JsonDatabase();

export const db = {
  async getUsers(): Promise<User[]> {
    const mongo = await getMongoDb();
    if (mongo) {
      const users = await mongo.collection('users').find({}).toArray();
      const notes = await mongo.collection('notes').find({}).toArray();
      return users.map(u => ({
        id: u.id || u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        notesCount: notes.filter(n => n.authorId === u.id).length,
      }));
    }
    return jsonDb.getUsers();
  },

  async getUserById(id: string): Promise<User | null> {
    const mongo = await getMongoDb();
    if (mongo) {
      const user = await mongo.collection('users').findOne({ id });
      if (!user) return null;
      return {
        id: user.id || user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }
    return jsonDb.getUserById(id);
  },

  async getUserByEmail(email: string): Promise<UserWithPassword | null> {
    const mongo = await getMongoDb();
    if (mongo) {
      const user = await mongo.collection('users').findOne({
        email: { $regex: new RegExp(`^${email}$`, 'i') },
      });
      if (!user) return null;
      return {
        id: user.id || user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }
    return jsonDb.getUserByEmail(email);
  },

  async createUser(user: UserWithPassword): Promise<User> {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection('users').insertOne(user);
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    }
    return jsonDb.createUser(user);
  },

  async updateUser(id: string, updates: Partial<UserWithPassword>): Promise<User | null> {
    const mongo = await getMongoDb();
    if (mongo) {
      const now = new Date().toISOString();
      await mongo.collection('users').updateOne(
        { id },
        { $set: { ...updates, updatedAt: now } }
      );
      return this.getUserById(id);
    }
    return jsonDb.updateUser(id, updates);
  },

  async deleteUser(id: string): Promise<boolean> {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection('users').deleteOne({ id });
      await mongo.collection('notes').deleteMany({ authorId: id });
      return true;
    }
    return jsonDb.deleteUser(id);
  },

  async getNotes(filters?: {
    category?: string;
    search?: string;
    sort?: string;
    authorId?: string;
  }): Promise<Note[]> {
    const mongo = await getMongoDb();
    if (mongo) {
      const query: Record<string, unknown> = {};
      if (filters?.category && filters.category !== 'all') {
        query.categoryId = filters.category.toLowerCase();
      }
      if (filters?.authorId) {
        query.authorId = filters.authorId;
      }
      if (filters?.search && filters.search.trim()) {
        const regex = new RegExp(filters.search.trim(), 'i');
        query.$or = [
          { title: regex },
          { description: regex },
          { authorName: regex },
          { tags: regex },
        ];
      }

      let sortOptions: Record<string, 1 | -1> = { isPinned: -1, createdAt: -1 };
      if (filters?.sort === 'downloads') sortOptions = { isPinned: -1, downloadsCount: -1 };
      else if (filters?.sort === 'views') sortOptions = { isPinned: -1, viewsCount: -1 };
      else if (filters?.sort === 'likes') sortOptions = { isPinned: -1, likesCount: -1 };
      else if (filters?.sort === 'oldest') sortOptions = { isPinned: -1, createdAt: 1 };
      else if (filters?.sort === 'alpha') sortOptions = { isPinned: -1, title: 1 };

      const notes = await mongo.collection('notes').find(query).sort(sortOptions).toArray();
      return notes.map(n => ({
        id: n.id || n._id.toString(),
        title: n.title,
        description: n.description,
        content: n.content,
        categoryId: n.categoryId,
        tags: n.tags || [],
        semester: n.semester,
        authorId: n.authorId,
        authorName: n.authorName,
        authorRole: n.authorRole,
        attachments: n.attachments || [],
        viewsCount: n.viewsCount || 0,
        downloadsCount: n.downloadsCount || 0,
        likesCount: n.likesCount || 0,
        likedBy: n.likedBy || [],
        isPinned: !!n.isPinned,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }));
    }
    return jsonDb.getNotes(filters);
  },

  async getNoteById(id: string): Promise<Note | null> {
    const mongo = await getMongoDb();
    if (mongo) {
      const n = await mongo.collection('notes').findOne({ id });
      if (!n) return null;
      return {
        id: n.id || n._id.toString(),
        title: n.title,
        description: n.description,
        content: n.content,
        categoryId: n.categoryId,
        tags: n.tags || [],
        semester: n.semester,
        authorId: n.authorId,
        authorName: n.authorName,
        authorRole: n.authorRole,
        attachments: n.attachments || [],
        viewsCount: n.viewsCount || 0,
        downloadsCount: n.downloadsCount || 0,
        likesCount: n.likesCount || 0,
        likedBy: n.likedBy || [],
        isPinned: !!n.isPinned,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      };
    }
    return jsonDb.getNoteById(id);
  },

  async createNote(note: Note): Promise<Note> {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection('notes').insertOne(note);
      return note;
    }
    return jsonDb.createNote(note);
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
    const mongo = await getMongoDb();
    if (mongo) {
      const now = new Date().toISOString();
      await mongo.collection('notes').updateOne(
        { id },
        { $set: { ...updates, updatedAt: now } }
      );
      return this.getNoteById(id);
    }
    return jsonDb.updateNote(id, updates);
  },

  async deleteNote(id: string): Promise<boolean> {
    const mongo = await getMongoDb();
    if (mongo) {
      const res = await mongo.collection('notes').deleteOne({ id });
      return res.deletedCount > 0;
    }
    return jsonDb.deleteNote(id);
  },

  async incrementNoteViews(id: string): Promise<void> {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection('notes').updateOne({ id }, { $inc: { viewsCount: 1 } });
      return;
    }
    return jsonDb.incrementNoteViews(id);
  },

  async incrementNoteDownloads(id: string): Promise<void> {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection('notes').updateOne({ id }, { $inc: { downloadsCount: 1 } });
      return;
    }
    return jsonDb.incrementNoteDownloads(id);
  },

  async toggleNoteLike(id: string, userId: string): Promise<{ liked: boolean; count: number }> {
    const mongo = await getMongoDb();
    if (mongo) {
      const note = await this.getNoteById(id);
      if (!note) return { liked: false, count: 0 };
      const alreadyLiked = note.likedBy?.includes(userId);
      if (alreadyLiked) {
        await mongo.collection('notes').updateOne(
          { id },
          { $pull: { likedBy: userId }, $inc: { likesCount: -1 } } as unknown as object
        );
        return { liked: false, count: Math.max(0, note.likesCount - 1) };
      } else {
        await mongo.collection('notes').updateOne(
          { id },
          { $addToSet: { likedBy: userId }, $inc: { likesCount: 1 } } as unknown as object
        );
        return { liked: true, count: note.likesCount + 1 };
      }
    }
    return jsonDb.toggleNoteLike(id, userId);
  },

  async getSettings(): Promise<SystemSettings> {
    const mongo = await getMongoDb();
    if (mongo) {
      const s = await mongo.collection('settings').findOne({});
      if (s) {
        return {
          allowPublicRegistration: s.allowPublicRegistration ?? false,
          maxUploadSizeBytes: s.maxUploadSizeBytes || 25 * 1024 * 1024,
          defaultAdminCreated: true,
          siteName: s.siteName || 'StudyNexus',
          siteTagline: s.siteTagline || 'Engineering Notes & Study Material Repository',
        };
      }
    }
    return jsonDb.getSettings();
  },

  async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    const mongo = await getMongoDb();
    if (mongo) {
      await mongo.collection('settings').updateOne(
        {},
        { $set: updates },
        { upsert: true }
      );
      return this.getSettings();
    }
    return jsonDb.updateSettings(updates);
  },

  async getAdminStats(): Promise<AdminStats> {
    const mongo = await getMongoDb();
    if (mongo) {
      const notes = await this.getNotes({});
      const users = await this.getUsers();

      const categoryBreakdown: Record<CategoryId, number> = {
        dbms: 0,
        oops: 0,
        ds: 0,
        dlco: 0,
        dms: 0,
        others: 0,
      };

      let totalDownloads = 0;
      let totalViews = 0;

      for (const n of notes) {
        if (categoryBreakdown[n.categoryId] !== undefined) {
          categoryBreakdown[n.categoryId]++;
        }
        totalDownloads += n.downloadsCount || 0;
        totalViews += n.viewsCount || 0;
      }

      return {
        totalNotes: notes.length,
        totalUsers: users.length,
        totalDownloads,
        totalViews,
        categoryBreakdown,
        recentNotes: notes.slice(0, 5),
        recentUsers: users.slice(0, 5),
      };
    }
    return jsonDb.getAdminStats();
  },
};
