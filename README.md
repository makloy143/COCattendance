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
- **QR Scan** — kiosk camera scanning for automatic time in/out

## Requirements

- Node.js 18+
- npm

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

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

## Default admin login

| Field    | Value     |
|----------|-----------|
| Username | `admin`   |
| Password | `admin123` |

Change the password after first login in production by updating the admin record in the database.

## Production

```bash
npm run build
npm start
```

Set a strong `AUTH_SECRET` in `.env` before deploying.

## Project structure

- `src/app/(dashboard)/` — Admin pages (dashboard, students, attendance)
- `src/app/login/` — Admin login
- `src/app/api/` — REST API routes
- `prisma/` — Database schema and migrations
- `public/uploads/students/` — Student profile photos

## Usage

1. Sign in with the admin account
2. Go to **Students → Add Student** to register a student with photo
3. Open a student profile to record **Time In** / **Time Out**
4. Use **Attendance** for a full list of today's status for all students
5. View summary stats on the **Dashboard**
6. Go to **Reports** to filter by date range and export Excel or PDF
7. Open **QR Scan** for kiosk scanning, or print QR codes from student profiles
