# 💰 Personal Finance & Obligation Tracker — MyCA

A full-stack personal finance app to manage loans, bills, daily expenses, and account balance in one unified system. Features Telegram notifications, automatic overdue detection, spend projections, and expense report image exports.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) + Motor (async MongoDB) |
| Database | MongoDB Atlas (free tier) |
| Scheduler | APScheduler (daily reminders + overdue checks) |
| Notifications | Telegram Bot API (via httpx) |
| Frontend | React + Vite + Chart.js |
| Hosting | Render (free tier) |
| Keep-alive | UptimeRobot → `/health` every 10 min |

---

## Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt

# Copy and edit env file
cp ../.env.example .env
# Edit .env with your MongoDB URI, Telegram credentials
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev   # Starts on http://localhost:5173
```

### 3. Start Backend

```bash
# From project root
uvicorn backend.main:app --reload --port 8000
```

Visit `http://localhost:5173` — the Vite dev server proxies `/api` requests to the FastAPI backend.

---

## Getting Your Telegram Chat ID

1. Message your bot [@MypersonalCAbot](https://t.me/MypersonalCAbot) with any text (e.g. "hi")
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find `result[0].message.from.id` — that's your chat ID
4. Set it in `.env` as `TELEGRAM_CHAT_ID=<your_id>`  
   **OR** configure it from the Account Settings page in the dashboard

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string | ✅ |
| `DATABASE_NAME` | Database name (default: `finance_tracker`) | ✅ |
| `TELEGRAM_BOT_TOKEN` | From BotFather | Optional |
| `TELEGRAM_CHAT_ID` | Your Telegram user ID | Optional |
| `APP_TIMEZONE` | Timezone for scheduler (default: `Asia/Kolkata`) | ✅ |

---

## Features

- **Obligations Tracker** — Unified loans + bills with recurrence, overdue detection, EMI tracking
- **Daily Expenses** — Manual entry with category budgets and real-time % used
- **Account Balance** — Auto-deduction on payments, income tracking, full audit trail
- **Smart Dashboard** — Overdue alerts, upcoming dues, budget progress, spending charts
- **Telegram Reminders** — Smart cadence (7-14d weekly, 0-7d every 2 days, overdue escalating)
- **Expense Reports** — Server-side PNG export with date range + category filters
- **Habit Streak** — Consecutive months within budget
- **Spend Projection** — Based on daily rate × remaining days

---

## Deployment (Render)

1. Push code to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Connect your GitHub repo
4. Set environment variables in Render dashboard
5. Deploy — Render runs `pip install` + `npm run build` automatically

### Keep-Alive Setup (UptimeRobot)
1. Go to [UptimeRobot](https://uptimerobot.com) (free)
2. Add HTTP monitor → `https://your-app.onrender.com/health`
3. Set interval: **every 5 minutes**
4. This prevents the app from sleeping and keeps APScheduler running

### External Cron (Backup for Scheduler)
If UptimeRobot is unavailable, use [cron-job.org](https://cron-job.org):
1. Create a cron job → POST `https://your-app.onrender.com/api/trigger-daily-job`
2. Schedule: `0 8 * * *` (8:00 AM IST = 2:30 AM UTC)

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check for UptimeRobot |
| GET | `/api/dashboard` | Full dashboard data |
| GET/POST | `/api/obligations` | List/create loans & bills |
| POST | `/api/obligations/{id}/mark-paid` | Pay EMI/bill |
| GET/POST | `/api/payments` | List/add expenses |
| GET/POST | `/api/budgets` | Manage category budgets |
| GET | `/api/budgets/summary` | Budget vs spend + projections |
| GET | `/api/account` | Account balance + settings |
| POST | `/api/account/add-funds` | Record income |
| GET | `/api/account/projected` | Balance after upcoming dues |
| GET | `/api/export/report` | Download expense report PNG |
| POST | `/api/trigger-daily-job` | Manually run reminder job |

---

## Project Structure

```
finance-tracker/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings (pydantic-settings)
│   ├── database.py          # Motor client
│   ├── scheduler.py         # APScheduler setup
│   ├── models/              # MongoDB document shapes
│   ├── schemas/             # API request/response DTOs
│   ├── routers/             # HTTP route handlers
│   ├── services/            # Business logic
│   └── requirements.txt
├── frontend/                # Vite React app
│   ├── src/
│   │   ├── pages/           # Full page components
│   │   ├── components/      # Reusable UI components
│   │   ├── api/             # API client functions
│   │   └── utils/           # Formatters, helpers
│   └── vite.config.js
├── .env.example
├── render.yaml
└── README.md
```
