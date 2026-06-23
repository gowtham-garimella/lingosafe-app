# LingoSafe - Project Architecture & Deployment Report

LingoSafe is a production-ready, fully responsive full-stack multilingual web application built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM**. 

The application offers instant translation switching across six major languages (English, Spanish, Hindi, Portuguese, Chinese, and French) with a specialized security interceptor blocking immediate access to French until the user completes email-based OTP (One-Time Password) verification.

---

## 1. Executive Summary & Features

### Core Capabilities
* **Instant i18n Localization**: Supports client-side localization using `react-i18next` and separate JSON dictionary files. State persists automatically in browser `localStorage`.
* **Dynamic Language Selector**: Glassmorphic, custom-animated dropdown displaying active flag/language status.
* **OTP French Interceptor Modal**:
  * Blocks activation of French until a 6-digit OTP code sent to the user's verified email address is successfully validated.
  * Features individual, auto-advancing numeric input cells with backspace regression and full-code paste support.
  * Restricts login validation to a **5-minute expiration timer** and throttles duplicate resend requests to a **60-second cooldown**.
* **Micro-Animations**: Uses `framer-motion` for floating background blobs, bouncy language badge transitions, and a physically shaking modal error animation.

---

## 2. Technical System Architecture

```mermaid
graph TD
    Client[Next.js Client App] -->|Swaps Language| i18n[i18next LocalStorage Cache]
    Client -->|French Selected| Modal[OTP Verification Modal]
    Modal -->|1. POST /api/send-otp| API_Send[Serverless Send-OTP Route]
    Modal -->|2. POST /api/verify-otp| API_Verify[Serverless Verify-OTP Route]
    
    API_Send -->|Generate & Save Hash| DB[(Neon PostgreSQL Database)]
    API_Send -->|Send HTML Email| Mailer[Nodemailer SMTP / Console Logs]
    
    API_Verify -->|Read Hash & Validate Attempts| DB
    API_Verify -->|If Success: Invalidate OTPs| DB
    API_Verify -->|Return Status| Client
```

---

## 3. Database Schema & API Services

### Database Model (`Prisma schema.prisma`)
The system uses Prisma ORM connected to a PostgreSQL database with an index on the email column for fast lookups.

```prisma
model OtpRecord {
  id        Int      @id @default(autoincrement())
  email     String
  otp       String   // SHA-256 hashed OTP for database security
  expiresAt DateTime
  verified  Boolean  @default(false)
  attempts  Int      @default(0)
  createdAt DateTime @default(now())

  @@index([email])
}
```

### Serverless API Routes
* **`POST /api/send-otp`**: Validates request formats, checks for the 60s duplicate throttle limit, generates a 6-digit numeric token, hashes it using SHA-256, saves it, and dispatches the HTML email.
* **`POST /api/verify-otp`**: Fetches the latest OTP record, validates expiration, checks if attempts exceed `3` (triggering lockout), compares SHA-256 hashes, and invalidates other pending tokens upon success.

---

## 4. Important Points: Configuration Variables

To deploy this project to production on **Vercel**, the following environment variables must be configured in your Vercel Dashboard under **Project Settings ➔ Environment Variables**.

### 🗄️ Database Connection
The application uses your **Neon PostgreSQL database** to securely log and verify OTP tokens.
* **Variable Key**: `DATABASE_URL`
* **Vercel & Local Value**: 
  `postgresql://neondb_owner:npg_2TfhbY9HFgSN@ep-dawn-glitter-ahhktogp-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

### 📧 Email Dispatcher (SMTP Mailer)
The application connects to your Gmail SMTP server to send out the verification code emails.

| Environment Variable Key | Configured Value | Description |
| :--- | :--- | :--- |
| **`SMTP_HOST`** | `smtp.gmail.com` | Google's secure SMTP host server. |
| **`SMTP_PORT`** | `587` | Standard TLS port for secure email submission. |
| **`SMTP_USER`** | `your-email@gmail.com` | The Google account sending the verification emails. |
| **`SMTP_PASS`** | *[16-Character App Password]* | Generated via Google Account Settings (Security ➔ App passwords). |
| **`SMTP_FROM`** | `your-email@gmail.com` | The email address displayed in the recipient's "From" field. |

> [!NOTE]
> If the `SMTP_HOST` variable is left empty, the application runs in **Simulated Dev Mode** and logs generated OTPs directly to your Vercel runtime logs or terminal console instead of attempting to email them.

---

## 5. Security Protocols Implemented
1. **SHA-256 Encryption**: Plaintext OTP codes are never saved in the database. Only cryptographically secure SHA-256 hashes of the code are stored.
2. **Brute Force Lockout**: Maximum of 3 verification attempts are permitted per OTP request. On the 3rd fail, the token is permanently locked out.
3. **Automatic Invalidation**: Once an OTP is verified successfully, all other active OTP requests for that email address are instantly expired.
