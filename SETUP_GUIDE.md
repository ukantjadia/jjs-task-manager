# Task Manager - Complete Setup Guide

## Phase 1: Project Setup ✅ COMPLETE

The Next.js project has been created with all necessary dependencies and file structure.

### What's Been Done:
- ✅ Next.js 14 project with TypeScript and Tailwind CSS
- ✅ All dependencies installed (Clerk, googleapis, date-fns, react-hook-form, zod, uuid)
- ✅ Complete project structure created
- ✅ Type definitions for Project, Task, and Log entities
- ✅ Service layer (GoogleSheets, Project, Task, Log services)
- ✅ API routes for all endpoints
- ✅ Utility functions and validators
- ✅ Clerk authentication middleware
- ✅ Basic homepage with sign-in

## Phase 2: Authentication Setup (REQUIRED)

### Step 1: Create Clerk Account

1. Go to https://dashboard.clerk.com
2. Sign up or sign in
3. Click "Create Application"
4. Name it "Task Manager"
5. Select "Google" as the OAuth provider

### Step 2: Configure Google OAuth in Clerk

1. In Clerk Dashboard, go to **Configure** → **SSO Connections** → **Google**
2. Enable Google OAuth
3. **IMPORTANT**: Add the Google Sheets API scope:
   - Click "Add Scope"
   - Enter: `https://www.googleapis.com/auth/spreadsheets`
   - Save changes

### Step 3: Get Your Clerk Keys

1. In Clerk Dashboard, go to **API Keys**
2. Copy the following keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### Step 4: Update Environment Variables

Edit `task-manager/.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

## Phase 3: Run the Application

### Start Development Server

```bash
cd task-manager
pnpm dev
```

Open http://localhost:3000

### Test Authentication

1. Click "Sign In" button
2. Sign in with your Google account
3. Grant permissions (including Google Sheets access)
4. You should be redirected back to the app

## Phase 4: Connect Google Sheet

### Option A: Create New Sheet

1. Go to https://sheets.google.com
2. Create a new blank spreadsheet
3. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

### Option B: Use Existing Sheet

Just get the Sheet ID from your existing sheet's URL.

### Initialize the Sheet

Use the API to connect and initialize:

```bash
curl -X POST http://localhost:3000/api/sheets/connect \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "sheet_id": "YOUR_SHEET_ID_HERE"
  }'
```

**Note**: You'll need to get your session cookie from the browser's developer tools.

Alternatively, you can build a UI component to handle this (recommended for Phase 6).

## Phase 5: Test the API

### Create a Project

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "sheet_id": "YOUR_SHEET_ID",
    "project_name": "Test Project",
    "project_keywords": ["test", "demo"],
    "project_description": "My first project",
    "relevancy": "personal"
  }'
```

### Create a Task

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "sheet_id": "YOUR_SHEET_ID",
    "raw_text": "test: my first task",
    "priority": "High",
    "due_date": "2024-12-10"
  }'
```

### List Tasks

```bash
curl "http://localhost:3000/api/tasks?sheet_id=YOUR_SHEET_ID"
```

## Phase 6: Build Frontend Components (TODO)

The backend is complete. Next steps:

1. **Create Sheet Connection UI** (`components/SheetConnectForm.tsx`)
   - Form to input Sheet ID or URL
   - Button to initialize
   - Display connection status

2. **Build Task List Component** (`components/TaskList.tsx`)
   - Display tasks as cards
   - Checkbox to mark complete
   - Click to edit

3. **Build Task Create Form** (`components/TaskCreateForm.tsx`)
   - Quick entry input
   - Advanced options (collapsible)
   - Project auto-suggest

4. **Build Filters Component** (`components/Filters.tsx`)
   - Project dropdown
   - Status checkboxes
   - Date range picker

5. **Build Projects Page** (`app/projects/page.tsx`)
   - List all projects
   - Create/edit forms

6. **Build Summary Page** (`app/summary/page.tsx`)
   - Daily activity summary
   - Overdue tasks
   - Charts/stats

## Important Notes

### Google OAuth Token Access

The current implementation uses a simplified approach to access Google OAuth tokens:

```typescript
const googleAccount = user.externalAccounts?.find(a => a.provider === 'google')
const token = (googleAccount as any)?.accessToken
```

**For Production**: You may need to implement proper token refresh logic using Clerk's Backend API or Google's OAuth2 client.

### Sheet ID Storage

Currently, the Sheet ID must be passed with each API request. For better UX:

1. Store Sheet ID in Clerk user metadata after first connection
2. Retrieve it automatically in API routes
3. Allow users to change/reconnect sheets

### Error Handling

All API routes include basic error handling. Consider adding:
- Retry logic for transient failures
- Better error messages for users
- Logging/monitoring (Sentry, etc.)

## Troubleshooting

### "No Google access token" Error

**Cause**: Clerk doesn't have the Google Sheets scope or user hasn't granted permission.

**Fix**:
1. Check Clerk Dashboard → Google OAuth → Scopes
2. Ensure `https://www.googleapis.com/auth/spreadsheets` is added
3. User must sign out and sign in again to grant new permissions

### "Cannot access sheet" Error

**Cause**: Sheet ID is wrong or user doesn't have access.

**Fix**:
1. Verify Sheet ID is correct
2. Ensure the Google account used to sign in has access to the sheet
3. Check sheet sharing settings

### "Sheet ID required" Error

**Cause**: API request missing `sheet_id` parameter.

**Fix**: Include `sheet_id` in request body (POST) or query params (GET).

## Next Steps

1. ✅ Phase 1: Project Setup - COMPLETE
2. ⏳ Phase 2: Authentication - **DO THIS NOW**
3. ⏳ Phase 3: Google Sheets Integration - Ready to test
4. ⏳ Phase 4: Core Services - Complete (backend)
5. ⏳ Phase 5: API Routes - Complete
6. 📝 Phase 6: Frontend Components - **TODO**
7. 📝 Phase 7: Polish & Testing - **TODO**
8. 📝 Phase 8: Deployment - **TODO**

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Next.js Documentation](https://nextjs.org/docs)
- [Project Specifications](../resouces_docs/)

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure Clerk is configured with Google Sheets scope
4. Check Google Sheet permissions

---

**You're ready to continue! Start with Phase 2: Authentication Setup.**
