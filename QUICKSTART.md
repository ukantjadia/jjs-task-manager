# Quick Start Guide - 5 Minutes to Running App

## Prerequisites
- Node.js installed
- pnpm installed (`npm install -g pnpm`)
- Clerk account (you already have one!)

## Step 1: Configure Clerk (2 minutes)

1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to **User & Authentication** → **Email, Phone, Username**
4. Enable **Email address** and **Password**
5. Go to **Social Connections** → Enable **Google**
6. In Google settings, add scope: `https://www.googleapis.com/auth/spreadsheets`
7. Save all changes

## Step 2: Create Admin User (1 minute)

In Clerk Dashboard:
1. Go to **Users**
2. Click **Create User**
3. Enter:
   - Email: `admin@example.com`
   - Password: `admin.1234`
4. Click **Create**

## Step 3: Run the App (1 minute)

```bash
cd task-manager
pnpm dev
```

Open http://localhost:3000

## Step 4: Sign In (30 seconds)

1. Click **Sign In**
2. Enter:
   - Email: `admin@example.com`
   - Password: `admin.1234`
3. Click **Continue**

## Step 5: Connect Google Sheet (30 seconds)

You'll need to create a Google Sheet and connect it via API. For now, you can:

1. Create a new Google Sheet at https://sheets.google.com
2. Copy the Sheet ID from the URL
3. Use the API to connect (see API documentation)

## What You Can Do Now

✅ Sign in/out with email/password  
✅ Sign in with Google OAuth  
✅ Create multiple user accounts  
✅ Access protected API routes  
⏳ Connect Google Sheet (needs UI - coming in Phase 6)  
⏳ Create projects and tasks (needs UI - coming in Phase 6)  

## Next Steps

The backend is fully functional. To complete the app:

1. **Build Sheet Connection UI** - Form to connect Google Sheet
2. **Build Task Management UI** - Create, list, edit tasks
3. **Build Projects UI** - Manage projects
4. **Build Summary Dashboard** - View daily activity

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed implementation plan.

## Troubleshooting

### Can't sign in?
- Check Clerk Dashboard → Users to verify admin account exists
- Verify email/password authentication is enabled

### "Unauthorized" error?
- Make sure you're signed in
- Check that middleware is configured correctly

### Need help?
- See [CLERK_SETUP.md](./CLERK_SETUP.md) for authentication setup
- See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for full implementation guide
- Check [CREDENTIALS.md](./CREDENTIALS.md) for test accounts

---

**You're all set!** The authentication is working. Now you can build the frontend UI or test the API endpoints.
