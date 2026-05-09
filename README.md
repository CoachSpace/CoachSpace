# 🌸 CoachSpace – Client Project Management Portal

A beautiful, fully functional MVP project management web app for coaches. Each client gets a unique shareable link — no login required.

---

## ✦ What's Included

- **Unique shareable project links** (e.g. `/project/mary-brand-x7k29p`)
- **Editable client/project header** (name, specialty, email, phone, status, dates)
- **5 tabs**: Welcome, Roadmap, Updates, Comments, Resources
- **All data persists in Supabase** — refresh-safe, shareable
- **Beautiful feminine design**: Blush pink, Dark wine, Soft cream
- **Responsive** across desktop, tablet, and mobile

---

## 🛠️ Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18 |
| Styling | Custom CSS with CSS variables (no Tailwind needed) |
| Database | Supabase (PostgreSQL) |
| Fonts | Lora (headings) + Poppins (body) |
| Hosting | Vercel / Netlify / any static host |

---

## 🚀 Setup Instructions

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free tier works perfectly)
2. Click **New Project**
3. Name it `coachspace` (or anything you like)
4. Choose a region close to you
5. Set a strong database password and save it somewhere safe
6. Wait ~2 minutes for it to provision

### Step 2 — Run the SQL Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open `supabase-schema.sql` from this project
4. Paste the entire contents into the editor
5. Click **Run** (green button)
6. You should see "Success. No rows returned."

### Step 3 — Get Your API Keys

1. In Supabase, go to **Project Settings → API**
2. Copy:
   - **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### Step 4 — Configure Environment Variables

1. In your project root, copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your keys:
   ```
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 5 — Install & Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

---

## 📁 Folder Structure

```
coach-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ProjectHeader.js    # Editable client/project banner
│   │   ├── WelcomeTab.js       # Welcome message, video, checklist
│   │   ├── RoadmapTab.js       # Roadmap stages with reordering
│   │   ├── UpdatesTab.js       # Tasks with progress sliders
│   │   ├── CommentsTab.js      # Comments grouped by task
│   │   ├── ResourceTab.js      # Links, docs, brand assets
│   │   └── Toast.js            # Success/error notifications
│   ├── lib/
│   │   ├── supabase.js         # Supabase client
│   │   └── slugify.js          # Unique slug generator
│   ├── pages/
│   │   ├── HomePage.js         # Create new project
│   │   └── ProjectPage.js      # Main project view with tabs
│   ├── App.js                  # Client-side routing
│   ├── index.js                # React entry point
│   └── index.css               # Global styles & design tokens
├── supabase-schema.sql         # Run this in Supabase SQL Editor
├── .env.example                # Copy to .env and fill in keys
├── package.json
└── README.md
```

---

## 🔗 How the Shareable Link System Works

### Creating a Project (You / Coach)
1. Go to `/` (homepage)
2. Fill in client name and project name
3. Click **Create Project & Generate Link**
4. A unique slug is generated, e.g. `mary-brand-x7k29p`
5. The project is saved to Supabase
6. You get the link: `yourapp.com/project/mary-brand-x7k29p`

### Sharing with a Client
- Copy the link and send it via email, WhatsApp, or any channel
- Anyone with the link can view AND edit the project
- No account, no login, no password needed for MVP

### Why It's Reasonably Secure
- Slugs are **randomly generated** (6 random alphanumeric chars)
- With ~2.2 billion possible combinations, brute-force guessing is impractical
- Only someone with the exact link can access the project

---

## 🌐 Deploying to Production

### Deploy to Vercel (Recommended — Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. In Vercel project settings → **Environment Variables**, add:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
4. Click **Deploy**
5. Vercel gives you a live URL like `coachspace.vercel.app`

### Deploy to Netlify

1. Push to GitHub
2. Connect to Netlify
3. Add environment variables in Site Settings → Build & Deploy → Environment
4. Build command: `npm run build`
5. Publish directory: `build`

### Important: Netlify Redirects

For client-side routing to work on Netlify, create `public/_redirects`:
```
/*  /index.html  200
```

For Vercel, create `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## ➕ Creating New Client Projects

### Method 1: Via the Homepage (Easiest)
Navigate to your app's root URL (e.g., `https://yourapp.vercel.app/`)
Fill in the form and click Create. Done.

### Method 2: Via Supabase (Direct)
Run this SQL in the Supabase SQL Editor:
```sql
insert into projects (project_slug, client_name, project_name, client_email, project_status, welcome_message)
values (
  'sarah-rebrand-k9x2m7',
  'Sarah Williams',
  'Business Rebrand 2026',
  'sarah@email.com',
  'In Progress',
  'Welcome Sarah! So excited to work on your rebrand together.'
);
```
Then share the link: `yourapp.com/project/sarah-rebrand-k9x2m7`

---

## 🔒 Future Security Improvements

Here's how to make this more secure post-MVP:

### 1. Password-Protected Project Links
Add a `project_password` (hashed) column to `projects`. When a user opens a project link, prompt for password before showing content. Use bcrypt or Supabase's built-in auth for hashing.

### 2. Client PIN Access
Simpler than passwords — store a 4-6 digit PIN hashed in the database. Client enters PIN on first visit, stored in `localStorage` for session. Good middle ground for MVP→Production.

### 3. Admin-Only Editing
Add a `coach_password` field. Show edit buttons only when the coach is "authenticated" (checked against a session token stored in localStorage). Clients get view-only mode.

### 4. View-Only vs Edit Mode
Add a `?mode=view` URL parameter. When present, hide all edit buttons and save functions. Share the view link with clients, keep the edit link private.

```
Edit link:  /project/mary-x7k29p          (coach only)
View link:  /project/mary-x7k29p?mode=view  (share with client)
```

### 5. Supabase Row-Level Security (Per-Project Auth)
Use Supabase Auth to issue JWT tokens per project. The RLS policies can restrict access so only the token-holder can read/write that specific project. This is the most robust solution for a proper SaaS product.

### 6. Full Login Portal
Add Supabase Auth (email/password or magic link). Each coach has an account. Projects are owned by coach accounts. Clients can be invited via email with time-limited tokens.

---

## 💡 Tips & Notes

- **Progress sliders** auto-save 700ms after you stop dragging
- **Checklist items** save instantly on click
- **Roadmap items** can be reordered with ↑ ↓ buttons
- **Comments** are grouped under their respective tasks
- **Resources** are grouped by type (Link, Brand Asset, Login Info, etc.)
- The **Share Link** button in the top bar copies the current project URL

---

## 📊 Database Tables Summary

| Table | Purpose |
|-------|---------|
| `projects` | Core client & project info |
| `checklist_items` | Welcome tab checklist with completion state |
| `roadmap_items` | Roadmap stages with status & ordering |
| `updates` | Tasks with progress percentage |
| `comments` | Comments linked to specific tasks |
| `resources` | Links, docs, and brand assets |

---

Built with ✦ by CoachSpace
