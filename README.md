# 📚 StudyNexus - Peer Notes & Engineering Study Hub

A modern, high-performance web platform built with **Next.js 16**, **React 19**, and **Tailwind CSS** for students and friends to upload, preview, search, and share study notes in **any format**. Features role-based authority, comprehensive admin controls, and responsive UI optimized for mobile phones and laptops.

---

## ✨ Key Features

### 📁 Any Format File Sharing & Notes
- **Upload Any Format**: Supports PDFs, Word Documents (`.docx`, `.doc`), PowerPoint (`.pptx`), Excel (`.xlsx`), Images (`.png`, `.jpg`, `.webp`), Source Code (`.py`, `.cpp`, `.java`, `.js`, `.ts`, `.sql`), Compressed Archives (`.zip`, `.rar`), and Plain Text (`.txt`, `.md`).
- **Rich Typed Notes**: Direct Markdown and formula support for students typing lecture notes directly in the browser.
- **In-Browser Previews**:
  - Embedded PDF viewer with page fit and zoom.
  - Lightbox image viewer for diagrams and formulas.
  - Formatted text/code viewer with 1-click **Copy to Clipboard**.
- **High-Speed Direct Downloads**: Tracks download counts and serves files with proper filenames and MIME types.

---

### 🏷️ 6 Specialized Subject Categories
Every note is classified under one of the 6 core categories with dedicated color palettes and badges:
1. **`dbms`** - Database Management Systems (SQL, Normalization, ACID, Indexing, Transactions)
2. **`oops`** - Object-Oriented Programming (Classes, Inheritance, Polymorphism, SOLID, Java/C++)
3. **`ds`** - Data Structures & Algorithms (Trees, Graphs, Sorting, Hash Maps, Traversal)
4. **`dlco`** - Digital Logic & Computer Organization (K-Maps, RISC Pipeline, ALUs, Boolean Algebra)
5. **`dms`** - Discrete Mathematical Structures (Set Theory, Relations, Graph Theory, Logic)
6. **`others`** - General, Operating Systems, Networks, Lab Manuals & Electives

---

### 🛡️ Full Admin Authority & Role-Based Access Control
The Administrator has full authority over the platform:
- **Controlled Registration (Default)**: Normal visitors cannot self-register unless authorized.
- **Admin Direct User Registration**: Admin can register classmates and friends directly (`Name`, `Email`, `Password`, `Role`).
- **User Management**:
  - View all registered users and their upload statistics.
  - Activate or Suspend users (suspended accounts cannot log in or upload).
  - Promote users to Admin or demote to Student.
  - Reset any user's password.
  - Delete user accounts and cascade-remove spam notes.
- **Content Moderation & Authority**:
  - Edit or delete **any** note on the platform.
  - Pin / Feature important notes to the top of feeds.
- **Analytics & Statistics**:
  - Real-time counters for total notes, total users, total downloads, and note views.
  - Visual breakdown chart across the 6 subjects.

---

### 📱 Responsive UI for Mobile & Laptop
- **Mobile First**:
  - Native-app style floating bottom navigation bar (`Feed`, `Search`, `+ Upload`, `Subjects`, `Admin/Account`).
  - Horizontal swipeable subject chips with category note counters.
  - Touch-friendly tap targets and responsive drag-and-drop file upload.
- **Laptop & Desktop**:
  - Fast search with keyboard shortcuts (`/` or `Ctrl+K`).
  - Grid view vs. List view switcher.
  - Sort by: *Newest First*, *Most Downloaded*, *Most Viewed*, *Most Liked*, *Alphabetical*.
  - Dark mode and Light mode with smooth theme transitions.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install --ignore-scripts

# 2. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Admin Credentials:
- **Email**: `admin@notes.local`
- **Password**: `Admin@12345`

---

## 🌐 Deploy to Vercel

1. Push this repository to GitHub.
2. Import repository on [vercel.com](https://vercel.com).
3. Set environment variables (see [DEPLOYMENT.md](file:///d:/notes/DEPLOYMENT.md) and [.env.example](file:///d:/notes/.env.example)):
   - `JWT_SECRET`: Random 32+ character string.
   - `MONGODB_URI`: (Optional) Free MongoDB Atlas connection string for persistent cloud storage.
   - `BLOB_READ_WRITE_TOKEN`: (Optional) Free Vercel Blob token for file storage.
4. Click **Deploy**!

---

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19, Tailwind CSS 4, Lucide React
- **Authentication**: JWT with `jose`, `bcryptjs`, and HTTP-only cookies
- **Database**: Unified adapter supporting **MongoDB Atlas** and built-in persistent JSON fallback
- **Storage**: Multi-provider adapter supporting **Vercel Blob**, **Cloudinary**, and base64 inline fallback
