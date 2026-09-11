# KrishiQueue - Farmer Procurement Queue Management System

**SIH 2026 - Problem Statement 26032**

A full-stack (MERN) farmer procurement queue system. Farmers book a digital token, track their
live queue position, get their produce weighed and graded, and receive payment - all backed by a
real database, real-time updates, and a voice assistant for hands-free booking.

---

## Quick Start (one command)

No MongoDB install, no Atlas account, no manual `.env` setup needed to just try it out.

```bash
npm run install:all   # installs backend + frontend dependencies
npm run dev            # starts both servers together
```

Open **http://localhost:5173**. That's it.

The backend automatically starts a built-in in-memory MongoDB the first time you run it if you
haven't configured a real one (see section 3) - this only needs internet access once, to download
a small MongoDB binary (cached after that). Data resets when you stop the server; set `MONGO_URI`
in `backend/.env` for a real, persistent database.

Want demo accounts and sample data instead of an empty system? Run:

```bash
npm run seed
```

This creates an admin (`agency@admin` / `admin123`), an operator (`desk1@operator` / `operator123`),
one procurement centre, and two crops with MSP rates.

---

## 1. Project structure

```
krishiqueue/
├── package.json          # root - one-command install/dev scripts
├── backend/               # Express + MongoDB API
│   ├── server.js
│   ├── src/
│   │   ├── config/db.js   # connects to MONGO_URI, or auto-starts in-memory MongoDB
│   │   ├── models/        # User, Centre, Crop, Booking, Otp, Payout, Notification, AuditLog
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/auth.js
│   │   └── utils/         # token, audit, socket, razorpayPayout, sms, seed
│   ├── package.json
│   └── .env.example
└── frontend/              # React + Vite SPA
    ├── src/
    │   ├── api/api.js
    │   ├── context/        # Auth, Toast, Language, Socket
    │   ├── components/     # Layout, VoiceAssistant, BookingSummary, QueueTable, BookingsTable
    │   ├── i18n/            # English/Hindi translations
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── farmer/      # Home, BookToken, MyToken, MyHistory, BankDetails
    │   │   ├── operator/    # Home, LiveQueue, Procurement, BookingRecords, ScanCheckIn
    │   │   └── admin/       # Home, Centres, CropsMSP, AllBookings, Payouts, Analytics, AuditLog
    │   ├── App.jsx
    │   └── styles.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 2. Prerequisites

- Node.js 18+ and npm
- Internet access on first run (to fetch npm packages, and once for the in-memory MongoDB binary
  if you're not using a real database)

---

## 3. Running the backend and frontend separately (optional)

If you don't want the root one-command scripts, run each side manually:

```bash
cd backend
npm install
npm run dev      # http://localhost:5000
```

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

### Using a real, persistent MongoDB instead of the in-memory one

Copy `backend/.env.example` to `backend/.env` and set:

```
MONGO_URI=mongodb://127.0.0.1:27017/krishiqueue
```

or a MongoDB Atlas connection string. Leave it unset/commented to keep using the zero-setup
in-memory database.

---

## 4. How authentication works

- **Farmers** log in with **mobile number + OTP** (no password). Enter the mobile number, receive
  a 6-digit OTP (real SMS via Twilio if configured, otherwise shown directly on screen in demo
  mode), then enter it along with name/village on first login.
- **Operators / Admins** log in with a **fixed-format ID + password** (hashed with bcrypt). The ID
  must end with `@admin` or `@operator` to match the role - e.g. `agency@admin` can only ever be
  an admin, `desk1@operator` can only ever be an operator. A mismatched suffix is rejected
  immediately with a clear "you are not {role}" error.
- All API requests after login carry a **JWT** in the `Authorization: Bearer <token>` header.
- **Payments** to farmers are sent via **RazorpayX Payouts** to the bank account they add on their
  dashboard. Without real RazorpayX credentials in `.env`, the system clearly labels the payment
  as **demo mode** instead of pretending it sent real money (see `.env.example` for the three
  variables needed to go live).

---

## 5. Core workflow

1. **Admin** creates a Procurement Centre and at least one Crop + MSP rate.
2. **Farmer** logs in (OTP), books a token by picking centre/crop/date/slot - or just asks the
   built-in **voice assistant** to do it: tap the mic, say "book token", and answer its follow-up
   questions about crop, quantity and date entirely by voice.
3. **Operator** sees the live queue (updates in real time via Socket.io), calls tokens, and can
   scan a farmer's QR code (or type their token) to check them in instantly.
4. **Operator** records weight, quality grade and moisture at the procurement desk. Net weight x
   MSP = payable amount, and a lot number is generated.
5. **Admin** sends the payment from the Pending Payments list - real via RazorpayX if configured,
   otherwise clearly marked demo mode. Every transaction (real or demo) is visible on the
   **Payouts** page.
6. **Farmer** sees live status, downloads a PDF receipt once paid, and can switch the whole app to
   Hindi at any time (button in the top bar, or just say "hindi" to the voice assistant).

---

## 6. API reference (summary)

| Method | Endpoint | Role | Purpose |
|--------|-----------|------|---------|
| POST | /api/auth/farmer/request-otp | public | Send OTP to farmer's mobile |
| POST | /api/auth/farmer/verify-otp | public | Verify OTP, log in / register |
| POST | /api/auth/staff-register | public | Operator/Admin registration (ID must match role suffix) |
| POST | /api/auth/staff-login | public | Operator/Admin login |
| GET | /api/auth/me | any (auth) | Current logged-in user |
| PUT | /api/auth/bank-details | farmer | Save bank account for payouts |
| GET/POST/PUT/DELETE | /api/centres | admin (write) | Manage procurement centres |
| GET/POST/DELETE | /api/crops | admin (write) | Manage crops & MSP |
| GET | /api/bookings/slots | any (auth) | Slot availability |
| POST | /api/bookings | farmer | Create a booking (generates token) |
| GET | /api/bookings/mine | farmer | My active booking + history |
| GET | /api/bookings/active | operator/admin | Active queue |
| PATCH | /api/bookings/call-next | operator | Call earliest waiting token |
| PATCH | /api/bookings/check-in | operator | QR/manual token check-in |
| PATCH | /api/bookings/:id/process | operator | Record weight/quality, generate lot |
| PATCH | /api/bookings/:id/pay | admin | Send payout (real or demo) |
| GET | /api/payouts | admin | All payout transactions |
| GET | /api/analytics/summary | admin | Aggregated stats for charts |
| GET | /api/audit | admin | Audit log |

---

## 7. Next steps for a real deployment

- Point `MONGO_URI` at a real MongoDB (Atlas free tier works well).
- Add real `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_X_ACCOUNT_NUMBER` to send real
  bank payouts (requires a KYC-verified RazorpayX business account).
- Add real `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` to send real OTP SMS.
- See `DEPLOYMENT.md` for deploying the backend (Render) and frontend (Vercel) for free.
