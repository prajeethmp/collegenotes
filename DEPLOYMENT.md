# 🚀 Vercel Deployment Guide for StudyNexus

This guide explains how to deploy **StudyNexus** to [Vercel](https://vercel.com) in under 5 minutes with zero cost.

---

## 📋 Prerequisites
1. A free [GitHub](https://github.com) account.
2. A free [Vercel](https://vercel.com) account.
3. (Optional for production persistence) A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) M0 cluster (512MB free forever).

---

## ⚡ Method 1: Deploy via Vercel Web Dashboard (Recommended)

### Step 1: Push Code to GitHub
Initialize git and push your repository to GitHub:
```bash
git init
git add .
git commit -m "Initial commit of StudyNexus notes portal"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### Step 2: Import Project to Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository and click **Import**.
4. Set Framework Preset to **Next.js**.

### Step 3: Add Environment Variables in Vercel
In the **Environment Variables** section of the deployment screen, configure:

| Variable | Recommended Value / Description | Required? |
| :--- | :--- | :--- |
| `JWT_SECRET` | Any random 32+ character string (e.g. `n8!bK9#xL2pQ5@vR7wY4zM1sT3uE6oI8`) | **Yes** |
| `MONGODB_URI` | Your free MongoDB Atlas URI (`mongodb+srv://...`) | Recommended for production |
| `MONGODB_DB_NAME` | `studynexus` | Optional (default: `studynexus`) |
| `BLOB_READ_WRITE_TOKEN` | Generated via Vercel Storage -> Blob (1-click) | Optional (for large files) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Optional |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Optional |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Optional |

> **Note on Storage:** If you do not configure Vercel Blob or Cloudinary, files under 4.5MB will still upload and download seamlessly using built-in inline data storage!

### Step 4: Click Deploy
Click **Deploy**. Vercel will build and deploy the Next.js serverless app in ~60 seconds.

---

## 🔑 Initial Administrator Credentials

Once deployed, log into the portal with the default Administrator account:
- **URL**: `https://<your-vercel-domain>/login`
- **Email**: `admin@notes.local`
- **Password**: `Admin@12345`

### As the Administrator, you can immediately:
1. Open the **Admin Panel** (`/admin`).
2. Register your friends and classmates (`Register New User` button).
3. Toggle whether registration is **Admin-Only** (default) or **Open to public**.
4. Feature / Pin important notes to the top of category feeds.
5. Edit or delete any note across the 6 subjects.

---

## 📱 Mobile & Laptop Experience

- **On Mobile Phones**:
  - Sticky top header with fast search and category drawer.
  - Floating bottom navigation dock: `[Feed]`, `[Search]`, `[+ Upload]`, `[Subjects]`, `[Admin/Account]`.
  - Responsive upload modal with single-tap file selection.
  - Full-screen PDF and image previewers.
- **On Laptops / Desktops**:
  - Keyboard shortcuts (`/` or `Ctrl+K` for search, `Esc` to close modals).
  - Multi-column grid or list view toggle.
  - High-resolution PDF inline viewer with page zoom.
  - Dark / Light mode toggle with automatic preference sync.
