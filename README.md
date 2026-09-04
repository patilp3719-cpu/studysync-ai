# StudySync AI — Project Overview

## What is StudySync AI?

**StudySync AI** is a full-stack AI-powered productivity web app built specifically for students. It helps them organize their academic workload, detect procrastination patterns, and analyze their study focus habits — all powered by real AI (Groq LLM).

The app is production-ready and deployable to Vercel with a MongoDB Atlas database.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database | MongoDB + Mongoose (local dev / Atlas for prod) |
| Authentication | NextAuth.js (Credentials + JWT) |
| AI / LLM | Groq API (`openai/gpt-oss-120b`) |
| Deployment | Vercel |

---

## Project Structure

```
studysync-ai/
├── app/
│   ├── layout.tsx                        ← Root layout with Navbar + SessionProvider
│   ├── page.tsx                          ← Redirects to /dashboard
│   ├── dashboard/page.tsx               ← Summary stats + quick nav cards
│   ├── planner/page.tsx                 ← AI Semester Planner
│   ├── sessions/page.tsx                ← Procrastination Detector
│   ├── analyzer/page.tsx                ← Focus Analyzer
│   ├── login/page.tsx                   ← Login form
│   ├── signup/page.tsx                  ← Signup form
│   └── api/
│       ├── auth/[...nextauth]/route.ts  ← NextAuth handler
│       ├── register/route.ts            ← User registration
│       ├── tasks/route.ts               ← GET + POST tasks
│       ├── tasks/[id]/route.ts          ← PATCH + DELETE task
│       ├── sessions/route.ts            ← GET + POST study sessions
│       ├── focus-logs/route.ts          ← GET + POST focus logs
│       ├── ai/schedule/route.ts         ← AI study schedule generator
│       ├── ai/procrastination/route.ts  ← AI procrastination analyzer
│       └── ai/focus-analysis/route.ts   ← AI focus coaching
├── components/
│   ├── Navbar.tsx                       ← Top nav with auth state
│   ├── SessionProviderWrapper.tsx       ← Client-side NextAuth wrapper
│   └── MarkdownRenderer.tsx            ← Custom markdown → HTML renderer
├── lib/
│   ├── db.ts                            ← Mongoose singleton connection
│   └── groq.ts                          ← Groq LLM client
├── models/
│   ├── User.ts                          ← User schema
│   ├── Task.ts                          ← Task schema
│   ├── StudySession.ts                  ← Study session schema
│   └── FocusLog.ts                      ← Focus log schema
├── middleware.ts                         ← Route protection
├── types/next-auth.d.ts                 ← Extended session types
└── .env.local                           ← Environment variables
```

---

## Environment Variables

```
MONGODB_URI=mongodb://localhost:27017/studysync   # Local dev
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000
GROQ_API_KEY=gsk_...your_groq_key
```

For production (Vercel): swap `MONGODB_URI` to your Atlas URI and `NEXTAUTH_URL` to your Vercel domain.

---

## Core Features

### 1. Authentication
- Email + password signup and login
- Passwords hashed with `bcryptjs`
- JWT-based sessions via NextAuth.js
- All feature routes protected by `middleware.ts`
- Each user's data is fully isolated by `userId`

### 2. AI Semester Planner (`/planner`)
- Add tasks with title, course, due date, and priority (low/medium/high)
- Tasks sorted by due date; toggle done/pending; delete
- **AI Schedule Generator**: select 1–30 days, Groq generates a full day-by-day study table
- Output rendered as a properly formatted HTML table via `MarkdownRenderer`

### 3. Smart Procrastination Detector (`/sessions`)
- Log study sessions: subject, date, planned start/end, actual start/end
- Per-session gap badge: ✅ On time / ⚠️ X min late / 🔴 X min late
- **AI Procrastination Analysis**: Groq analyzes up to 14 recent sessions, identifies which subjects have the biggest delays, labels overall procrastination level, gives 2–3 actionable tips
- AI output rendered with full markdown formatting

### 4. Study vs Distraction Analyzer (`/analyzer`)
- Log focus sessions: subject, date, focused minutes, distracted minutes, optional notes
- Live focus ratio preview as you type
- Per-session color-coded progress bars (green ≥70%, yellow ≥40%, red <40%)
- Overall stats banner showing cumulative focus ratio
- **AI Focus Coaching**: Groq analyzes up to 20 recent logs, identifies worst subjects, gives 3 habit-building recommendations
- AI output rendered with full markdown formatting

### 5. Dashboard (`/dashboard`)
- Server-side rendered (no loading states)
- Shows: pending task count + next deadline, last session procrastination gap, last focus log ratio
- Three color-coded quick action cards linking to each feature
- Friendly empty states for new users

---

## How AI Works (End to End)

```
User clicks AI button
       ↓
Client fetches /api/ai/[feature]
       ↓
API route: getServerSession → verify user
       ↓
Query MongoDB for user's recent data
       ↓
Compute metrics server-side (gaps, ratios, etc.)
       ↓
Build structured prompt with real data
       ↓
Call Groq API (openai/gpt-oss-120b, max 4096 tokens)
       ↓
Return { suggestion: "..." } as JSON
       ↓
Client renders suggestion via MarkdownRenderer component
(supports: bold, italic, headers, tables, blockquotes, lists, code, hr)
```

---

## How to Run Locally

```bash
# 1. Install dependencies
cd studysync-ai
npm install

# 2. Create .env.local (copy from .env.local.example and fill values)

# 3. Start MongoDB locally
mongod

# 4. Start dev server
npm run dev

# 5. Open http://localhost:3000
```

---

## How to Deploy to Vercel

1. Push `studysync-ai/` to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → Import project
3. Set **Root Directory** to `studysync-ai`
4. Add environment variables in Vercel dashboard:
   - `MONGODB_URI` → MongoDB Atlas connection string
   - `NEXTAUTH_SECRET` → strong random string
   - `NEXTAUTH_URL` → your Vercel deployment URL (e.g. `https://studysync-ai.vercel.app`)
   - `GROQ_API_KEY` → your Groq API key
5. Deploy ✅

---

## Suggested New Features to Make StudySync AI Unique for Student Developers

### 🔥 High Impact

| Feature | Why It's Unique |
|---|---|
| **Pomodoro Timer with AI** | Built-in focus timer; after each session auto-logs focus/distraction data to the Analyzer |
| **GitHub Activity Tracker** | Pull GitHub commit history via API; AI correlates coding activity with study sessions |
| **AI Code Review Planner** | Student pastes a coding assignment; AI breaks it into subtasks with time estimates and adds them to the Planner |
| **Exam Countdown Board** | Add exams with dates; dashboard shows days remaining with AI-suggested daily prep checklist |
| **Weekly AI Report** | Every Monday, auto-generate a weekly summary: tasks completed %, avg focus ratio, procrastination trend |

### ⚡ Medium Impact

| Feature | Why It's Useful |
|---|---|
| **Mood Tracker** | Log daily mood (1–5) alongside study sessions; AI correlates mood with productivity |
| **Resource Linker** | Attach URLs (YouTube, docs, articles) to tasks; AI summarizes the resource in one sentence |
| **Study Streak Counter** | Track consecutive days with at least one logged session; gamified streak badge on dashboard |
| **AI Flashcard Generator** | Student pastes notes; AI generates 5–10 flashcard Q&A pairs for quick revision |
| **Dark Mode** | Toggle between light and dark themes (Tailwind dark: classes) |

### 🛠 Developer-Specific

| Feature | Why It's Developer-Focused |
|---|---|
| **LeetCode / DSA Tracker** | Log problems solved per day; AI suggests which topics to focus on based on weak areas |
| **Project Progress Board** | Kanban-style board (To Do / In Progress / Done) for personal projects alongside coursework |
| **Tech Stack Notes** | Attach tech stack tags to tasks (React, Node, SQL); AI gives learning resource suggestions |
| **Interview Prep Planner** | Dedicated section to track interview prep topics with AI-generated study order |

---

## Security Notes

- All API routes verify session before DB access (401 if unauthenticated)
- Passwords are bcrypt-hashed (never stored in plain text)
- `.env.local` is gitignored — secrets never committed
- Each user can only access their own data (all queries filter by `userId`)
- `NEXTAUTH_SECRET` must be different between dev and production
