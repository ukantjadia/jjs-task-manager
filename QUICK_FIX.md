# 🚨 Quick Fix for "No Google Access Token" Error

## Your Current Error:

```
Error: "No Google access token found. Please reconnect your Google account."
Status: 403 Forbidden
```

## Why This Happens:

You're trying to access the API but you're either:
1. ❌ Not signed in
2. ❌ Signed in with email/password (no Google token)
3. ❌ Google OAuth not configured in Clerk

---

## ✅ Solution: 3 Steps to Fix

### Step 1: Configure Google OAuth in Clerk (5 minutes)

**You already have the scopes configured in Google Cloud!** Now add to Clerk:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click on your application
3. Left sidebar → **User & Authentication** → **Social Connections**
4. Find **Google** → Toggle **ON**
5. Click on **Google** to open settings
6. Toggle **"Use custom credentials"** → **ON**
7. Enter your credentials from Google Cloud Console:
   ```
   Client ID: [Your Google Client ID]
   Client Secret: [Your Google Client Secret]
   ```
8. Click **"+ Add scope"**
9. Enter: `https://www.googleapis.com/auth/spreadsheets`
10. Click **Add**
11. **Advanced Settings:**
    - Access type: **offline** ✅ (IMPORTANT!)
    - Prompt: **consent**
12. Click **Save**

### Step 2: Sign In with Google (1 minute)

1. Go to `http://localhost:3000`
2. If already signed in → Click **Sign Out**
3. Click **Sign In**
4. Choose **"Continue with Google"** (not email/password!)
5. Select your Google account
6. **Grant all permissions** (including Google Sheets)
7. You'll be redirected back to the app

### Step 3: Test the API (1 minute)

Now your API calls will work!

**Get your session cookie:**
1. Open DevTools (F12)
2. Application → Cookies → `__session`
3. Copy the value

**Test sheet connection:**
```bash
curl -X POST http://localhost:3000/api/sheets/connect \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_COOKIE_VALUE" \
  -d '{"sheet_id": "YOUR_GOOGLE_SHEET_ID"}'
```

**Expected response:**
```json
{
  "success": true,
  "sheet_id": "YOUR_SHEET_ID",
  "initialized": true
}
```

---

## 🎯 Quick Checklist

Before testing API:
- [ ] Google OAuth configured in Clerk
- [ ] Sheets scope added
- [ ] Access type set to "offline"
- [ ] Signed in with Google (not email!)
- [ ] Permissions granted
- [ ] Session cookie obtained

---

## 🔍 How to Verify It's Working

### Check 1: Clerk Dashboard

1. Go to Clerk Dashboard → **Users**
2. Click on your user
3. Check **"Connected accounts"**
4. Should show: **Google** ✅

### Check 2: Browser

1. Sign in to your app
2. Open DevTools → Console
3. Type: `document.cookie`
4. Should see `__session=...` ✅

### Check 3: API Test

```bash
# Health check (no auth needed)
curl http://localhost:3000/api/health

# Should return:
# {"status":"ok","timestamp":"...","sheets_connection":"ready"}
```

---

## 🆘 Still Not Working?

### Error: "Invalid credentials"

**Fix:** Double-check Client ID and Secret in Clerk match Google Cloud Console

### Error: "Insufficient scopes"

**Fix:** 
1. Add scope in Clerk: `https://www.googleapis.com/auth/spreadsheets`
2. Sign out and sign in again

### Error: "Redirect URI mismatch"

**Fix:** Add to Google Cloud Console authorized redirect URIs:
```
https://accounts.clerk.dev/v1/oauth_callback
```

### Can't Find Google OAuth in Clerk

**Path:** Dashboard → User & Authentication → Social Connections → Google

---

## 📞 Need More Help?

See detailed guides:
- `docs_md/GOOGLE_OAUTH_QUICKSTART.md` - Quick setup
- `docs_md/GOOGLE_OAUTH_PRODUCTION.md` - Complete guide
- `docs_md/GOOGLE_OAUTH_VISUAL_GUIDE.md` - Visual walkthrough

---

## ⚡ Super Quick Summary

```bash
# 1. Configure Clerk
Clerk Dashboard → Social Connections → Google
→ Use custom credentials → Add Client ID & Secret
→ Add scope: spreadsheets
→ Access type: offline
→ Save

# 2. Sign In
http://localhost:3000 → Sign In → Continue with Google
→ Grant permissions

# 3. Test
curl -X POST http://localhost:3000/api/sheets/connect \
  -H "Cookie: __session=YOUR_COOKIE" \
  -d '{"sheet_id": "YOUR_SHEET_ID"}'
```

---

**That's it!** Once you sign in with Google OAuth, all API calls will work. 🎉
