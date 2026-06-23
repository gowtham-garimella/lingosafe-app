# Multilingual Web Application with French OTP Verification

A full-stack production-ready web application built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **Node.js (Express)**, and **Prisma**. It features instant translation across 6 languages with email-based OTP verification blocking access to French.

---

## Architecture Overview

```mermaid
graph TD
    User([User Selector]) -->|Immediate Switch| Lang{en / es / hi / pt / zh}
    User -->|Interception| French[French Language Selected]
    French -->|Trigger Modal| Modal[Email Request]
    Modal -->|POST /send-otp| Backend[Express Backend]
    Backend -->|Generate 6-Digit OTP| DB[(Prisma Database)]
    Backend -->|Send Mail / Log to Console| SMTP[Nodemailer / Console]
    User2[User input OTP] -->|POST /verify-otp| Backend
    Backend -->|Compare Hash & Limits| Verified{Verified?}
    Verified -->|Success| UI[Change language to French & Persist]
    Verified -->|Fail| Lock[Show Error / Lockout after 3 attempts]
```

- **Frontend**: Next.js App Router, Framer Motion (animations), react-i18next (translation), and react-hot-toast (notifications).
- **Backend**: Node.js & Express API server handling OTP creation, expiration, attempts logging, and email dispatching via Nodemailer.
- **Database**: Prisma ORM configured for PostgreSQL, with simple SQLite fallback.

---

## Directory Structure

```
multilingual-otp-app/
├── backend/                  # Node.js + Express API Server
│   ├── src/
│   │   ├── controllers/      # OTP send/verify endpoint handlers
│   │   ├── server.ts         # Server entrypoint
│   │   └── db.ts             # Prisma Database connection
│   ├── prisma/               # Database Schema
│   ├── package.json
│   └── tsconfig.json
└── frontend/                 # Next.js Application
    ├── src/
    │   ├── app/              # App Router Pages & Styles
    │   ├── components/       # LanguageSelector & OtpModal
    │   ├── locales/          # Translation dictionaries
    │   ├── context/          # Interception state context
    │   └── i18n.ts           # i18next Configuration
    └── package.json
```

---

## Quick Start Guide

### Step 1: Database Initialization

By default, the database is configured for **PostgreSQL**. 

#### Option A: PostgreSQL (Default)
1. Open `backend/.env`.
2. Configure your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/dbname?schema=public"
   ```
3. Run the migrations:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

#### Option B: SQLite Development Fallback (Quick Setup)
If you don't have PostgreSQL running locally:
1. Open `backend/prisma/schema.prisma` and change the datasource provider to `sqlite`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
2. Open `backend/.env` and change the connection string:
   ```env
   DATABASE_URL="file:./dev.db"
   ```
3. Run the prisma initializer command (does not require setting up a database server):
   ```bash
   cd backend
   npx prisma db push
   ```

---

### Step 2: Configure Environment Variables

The backend uses environment variables to run. In `backend/.env`:
- **Server Port**: `PORT=5001` (keeps it separate from the Next.js frontend port `3001`).
- **SMTP Nodemailer credentials**:
  If you leave `SMTP_HOST` empty, **the application will run in local simulation mode** and print generated OTP codes directly to your backend terminal logs.
  If you want real emails, configure your SMTP settings:
  ```env
  SMTP_HOST="smtp.gmail.com"
  SMTP_PORT=587
  SMTP_USER="your-email@gmail.com"
  SMTP_PASS="your-app-password"
  SMTP_FROM="no-reply@yourdomain.com"
  ```

---

### Step 3: Run the Servers

Open two separate terminal windows or run them in the background.

#### Run Backend Server:
```bash
cd backend
npm run dev
```

#### Run Frontend Server:
```bash
cd frontend
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your web browser.

---

## Testing the Verification Flow

1. On the home page, select **Español**, **हिन्दी**, **Português**, or **中文** from the navigation dropdown. The UI changes immediately.
2. Select **Français 🇫🇷**. A modal pops up.
3. Input any valid email formatting (e.g. `test@example.com`) and click **Send Verification Code**.
4. Check your **Backend Terminal Window Output**. You will see:
   ```
   ======================================================
   [DEVELOPMENT MODE - EMAIL SIMULATION]
   To: test@example.com
   OTP Code: XXXXXX
   Expires: 23/06/2026, 10:15:00
   ======================================================
   ```
5. Enter the code in the OTP digits inputs:
   - **Invalid Code (Testing Attempts)**: Enter a wrong code. An error toast displays, showing attempts remaining. If you fail 3 times, you are locked out.
   - **Correct Code**: Enter the code. The modal closes, language immediately switches to French, and preference is saved!
