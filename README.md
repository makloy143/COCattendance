# COCiligan Attendance System

A modern admin web app for registering students, managing profile photos, and recording daily time in / time out attendance.

## Features

- Admin login with secure session
- Student registration with profile photo upload
- Individual student profiles with edit and deactivate
- Time in / time out recording (one record per student per day)
- Dashboard with today's attendance stats
- Searchable students list and attendance page
- **Reports** — export attendance to Excel (.xls) or PDF with date filters
- **Face Scan** — kiosk camera face recognition for automatic time in/out

## Tech stack

- Next.js 16 (App Router) — frontend **and** API routes in one app
- PostgreSQL via Prisma 7 (using the `@prisma/adapter-pg` driver adapter)
- Student photos are stored in the database (no local filesystem needed)

## Requirements

- Node.js 18+
- npm
- A PostgreSQL database (local, or a hosted one like Railway)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables and edit them:

```bash
copy .env.example .env
```

Set `DATABASE_URL` to your PostgreSQL connection string and `AUTH_SECRET` to a long random string.

3. Run database migration and seed:

```bash
npx prisma migrate dev
npx prisma db seed
```

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default admin logins

| Portal | Username | Password |
|--------|----------|----------|
| Attendance | `admin` | `admin123` |
| Attendance (super admin) | `superadmin` | `superadmin123` |
| Inventory | `inventory` | `inventory123` |
| Monitoring | `monitoring` | `monitoring123` |
| To-Do | `todo` | `todo123` |

The super admin can reset a student's completed attendance for the day (time in + time out), so they can record again. Regular admins cannot.

Change passwords after first login in production by updating the admin records in the database.

## Production

```bash
npm run build
npm start
```

The `build` script runs `prisma migrate deploy` automatically, so migrations are
applied to the target database during every build. Set a strong `AUTH_SECRET`
before deploying.

## Deployment — Vercel (app) + Railway (PostgreSQL)

This is a monolithic Next.js app: the frontend and the backend (API routes +
server components) run together on Vercel. Only the database lives on Railway.

### 1. Create the database on Railway

1. Create a new project on [Railway](https://railway.app) and add a
   **PostgreSQL** database.
2. Open the database service → **Connect / Variables** and copy the **public**
   connection string (the one with a `proxy.rlwy.net` host, reachable from
   outside Railway).
3. If you get SSL errors when connecting, append `?sslmode=require` to the URL.

### 2. Deploy the app on Vercel

1. Push this repo to GitHub and import it into [Vercel](https://vercel.com) as a
   new project (Vercel auto-detects Next.js).
2. Add these **Environment Variables** in the Vercel project settings (for all
   environments):
   - `DATABASE_URL` — the Railway public connection string from step 1.
   - `AUTH_SECRET` — a long random string.
3. Deploy. The build runs `prisma migrate deploy`, which creates all tables in
   the Railway database automatically.

### 3. Seed the initial accounts (once)

The seed creates the default admin accounts and the monitoring system catalog.
Run it once against the Railway database from your machine:

```bash
# DATABASE_URL must point at the Railway database
npx prisma db seed
```

(Alternatively run it from Railway's shell, or a one-off Railway service.)

After that, the app on Vercel is fully connected to the Railway PostgreSQL
database.

## Project structure

- `src/app/(dashboard)/` — Attendance admin pages (dashboard, students, attendance)
- `src/app/login/` — Attendance admin login
- `src/app/todos/` — To-Do portal (separate login + dashboard)
- `src/app/inventory/` — Inventory portal (separate login + dashboard)
- `src/app/monitoring/` — Monitoring portal (separate login + dashboard)
- `src/app/api/` — REST API routes (the backend)
- `src/app/api/students/[id]/photo/` — Serves student photos stored in the DB
- `prisma/` — Database schema and PostgreSQL migrations
- Student photos are stored in the `StudentPhoto` table (not on disk)

## Usage

1. Sign in with the attendance admin account
2. Go to **Students → Add Student** to register a student with photo
3. Open a student profile to record **Time In** / **Time Out**
4. Use **Attendance** for a full list of today's status for all students
5. View summary stats on the **Dashboard**
6. Go to **Reports** to filter by date range and export Excel or PDF
7. Open **Face Scan** for kiosk face recognition (enroll faces from profile photos on first use)
8. Open **To-Do** from the portal home and sign in with the todo admin account

Face recognition uses models in `public/models/` (TinyFaceDetector, FaceLandmark68, FaceRecognitionNet). Students need a clear front-facing profile photo; the kiosk can enroll existing photos with **Enroll from photos**.
