# Task Manager

A simple task management system powered by Google Sheets and Next.js.

## Features

- ✅ Google Sheets as database
- ✅ Project-based task organization
- ✅ Automatic task-project linking via keywords
- ✅ Activity logging and daily summaries
- ✅ Google OAuth authentication via Clerk

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Google Sheets
- **Auth**: Clerk (Google OAuth)
- **Package Manager**: pnpm

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Clerk Authentication

**Your Clerk keys are already configured!** Just enable authentication methods:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Enable **Email/Password** authentication
3. Enable **Google OAuth** with Sheets scope
4. Create admin user: `admin@example.com` / `admin.1234`

**See [CLERK_SETUP.md](./CLERK_SETUP.md) for detailed instructions.**

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Sign In

Use the admin account:
- Email: `admin@example.com`
- Password: `admin.1234`

Or create your own account via the Sign Up page.

### 4. Connect Google Sheet

1. Sign in with your Google account
2. Create a new Google Sheet or use an existing one
3. Use the sheet connection API to initialize it

## Project Structure

```
task-manager/
├── app/
│   ├── api/
│   │   ├── sheets/connect/    # Sheet connection
│   │   ├── tasks/             # Task CRUD
│   │   ├── projects/          # Project CRUD
│   │   ├── logs/              # Activity logs
│   │   └── health/            # Health check
│   ├── layout.tsx             # Root layout with Clerk
│   └── page.tsx               # Main dashboard
├── lib/
│   ├── services/
│   │   ├── googleSheets.service.ts
│   │   ├── project.service.ts
│   │   ├── task.service.ts
│   │   └── log.service.ts
│   ├── types/
│   │   ├── project.ts
│   │   ├── task.ts
│   │   └── log.ts
│   └── utils/
│       ├── dateHelpers.ts
│       ├── sheetHelpers.ts
│       └── validators.ts
└── middleware.ts              # Clerk auth middleware
```

## API Endpoints

### Sheets
- `POST /api/sheets/connect` - Connect Google Sheet
- `GET /api/sheets/connect` - Get connection status

### Tasks
- `GET /api/tasks` - List tasks (with filters)
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task
- `PATCH /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project
- `PATCH /api/projects/[id]` - Update project

### Logs
- `GET /api/logs` - Get activity logs
- `GET /api/logs/summary` - Get daily/weekly summary

## Usage

### Creating a Project

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "sheet_id": "YOUR_SHEET_ID",
    "project_name": "Capra",
    "project_keywords": ["capra", "personal-brand"],
    "project_description": "Personal branding system",
    "relevancy": "personal"
  }'
```

### Creating a Task

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "sheet_id": "YOUR_SHEET_ID",
    "raw_text": "capra: write outline for landing page",
    "priority": "High",
    "due_date": "2024-12-02"
  }'
```

## Google Sheets Structure

The app creates three sheets in your Google Spreadsheet:

1. **Projects** - Project definitions with keywords
2. **Tasks** - All tasks with project links
3. **DailyLog_[DATE]_to_[DATE]** - Activity logs (rotates every 10 days)

## Development

### Type Checking

```bash
pnpm tsc --noEmit
```

### Linting

```bash
pnpm lint
```

## Deployment

Deploy to Vercel:

```bash
pnpm vercel
```

Make sure to set environment variables in Vercel dashboard.

## Documentation

See the `resouces_docs/` folder for detailed specifications:
- `prd_task_management.md` - Product requirements
- `fst_technical_design.md` - Technical design
- `database_schema.md` - Google Sheets schema
- `api_specification.md` - API documentation
- `implementation_plan.md` - Build guide

## License

MIT
