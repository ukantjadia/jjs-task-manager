# Vercel Deployment Guide

## ✅ Deployment Readiness Checklist

### Code & Configuration
- [x] Next.js project structure is correct
- [x] `package.json` has build scripts (`build`, `start`)
- [x] TypeScript configuration is valid
- [x] `.gitignore` properly excludes sensitive files
- [x] No hardcoded localhost URLs in code (only in docs)
- [x] Middleware properly configured for Clerk
- [x] API routes are properly structured

### Environment Variables Required
You **MUST** set these in Vercel Dashboard before deployment:

#### Required Variables:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
CLERK_SECRET_KEY=sk_live_... (or sk_test_...)
```

#### Optional (if using custom Google OAuth):
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback/google
```

### Pre-Deployment Steps

#### 1. Update Clerk Dashboard (5 minutes)

**Add Production Domain:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Configure** → **Domains**
4. Add your Vercel domain: `your-app.vercel.app`
5. Or add your custom domain if you have one

**Verify Google OAuth Settings:**
1. Go to **User & Authentication** → **Social Connections** → **Google**
2. Ensure Google OAuth is enabled
3. Verify scope is added: `https://www.googleapis.com/auth/spreadsheets`
4. Check **Access type** is set to **offline** (for refresh tokens)

#### 2. Update Google Cloud Console (5 minutes)

**Add Authorized Domains:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   ```
   https://your-app.vercel.app
   https://www.your-app.vercel.app (if using custom domain)
   ```

5. Add to **Authorized redirect URIs**:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   https://accounts.clerk.dev/v1/oauth_callback
   ```

**Important:** Replace `your-app.vercel.app` with your actual Vercel domain.

#### 3. Test Build Locally (2 minutes)

```bash
cd task-manager
pnpm install
pnpm build
```

If build succeeds, you're ready to deploy!

---

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd task-manager
   vercel
   ```

4. **Follow the prompts:**
   - Link to existing project? **No** (first time)
   - Project name: `task-manager` (or your choice)
   - Directory: `./task-manager` (or `.` if already in task-manager)
   - Override settings? **No**

5. **Set Environment Variables:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to **Settings** → **Environment Variables**
   - Add all required variables (see above)
   - **Important:** Set them for **Production**, **Preview**, and **Development**

6. **Redeploy:**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **Add New Project**
   - Import your GitHub repository
   - Select the `task-manager` folder as root directory

3. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `task-manager`
   - Build Command: `pnpm build` (or `npm run build`)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `pnpm install` (or `npm install`)

4. **Set Environment Variables:**
   - In project settings, add all required variables
   - Set for **Production**, **Preview**, and **Development**

5. **Deploy:**
   - Click **Deploy**
   - Wait for build to complete

---

## 🔧 Post-Deployment Configuration

### 1. Update Clerk with Production URL

After deployment, update Clerk:
1. Go to Clerk Dashboard → **Configure** → **Domains**
2. Add your Vercel URL: `https://your-app.vercel.app`
3. Copy the **Frontend API** URL from Clerk
4. Update it in your Vercel environment variables if needed

### 2. Test Authentication Flow

1. Visit your deployed app: `https://your-app.vercel.app`
2. Click **Sign In**
3. Try both:
   - Email/Password sign in
   - Google OAuth sign in
4. Verify you can access the dashboard

### 3. Test Google Sheets Connection

1. Sign in with Google OAuth
2. Create or select a Google Sheet
3. Connect it via the Sheet Connect API
4. Verify tasks can be created

---

## ⚠️ Common Issues & Fixes

### Issue 1: "Invalid redirect URI"

**Cause:** Google Cloud Console doesn't have your Vercel domain.

**Fix:**
1. Add `https://your-app.vercel.app` to Google Cloud Console
2. Add `https://your-app.vercel.app/api/auth/callback/google` to redirect URIs
3. Wait 5-10 minutes for changes to propagate

### Issue 2: "Clerk authentication failed"

**Cause:** Clerk domain not configured or environment variables missing.

**Fix:**
1. Check Vercel environment variables are set correctly
2. Verify Clerk Dashboard has your Vercel domain added
3. Ensure you're using the correct keys (live vs test)

### Issue 3: "No Google access token"

**Cause:** User signed in with email/password instead of Google OAuth.

**Fix:**
1. User must sign out
2. Sign in again using **"Continue with Google"** button
3. Grant all permissions including Google Sheets

### Issue 4: Build fails on Vercel

**Cause:** Missing dependencies or TypeScript errors.

**Fix:**
1. Check build logs in Vercel Dashboard
2. Run `pnpm build` locally to catch errors
3. Ensure all dependencies are in `package.json`
4. Check for TypeScript errors: `pnpm tsc --noEmit`

### Issue 5: Environment variables not working

**Cause:** Variables not set for the correct environment.

**Fix:**
1. In Vercel Dashboard → Settings → Environment Variables
2. Ensure variables are set for **Production**, **Preview**, and **Development**
3. Redeploy after adding variables
4. Variables starting with `NEXT_PUBLIC_` are available in browser

---

## 📋 Production Checklist

Before going live, verify:

- [ ] All environment variables are set in Vercel
- [ ] Clerk domain includes your Vercel URL
- [ ] Google Cloud Console has your production domain
- [ ] Build succeeds without errors
- [ ] Authentication works (email/password and Google OAuth)
- [ ] Google Sheets connection works
- [ ] API endpoints respond correctly
- [ ] Error handling is in place
- [ ] HTTPS is enabled (automatic on Vercel)
- [ ] Custom domain configured (if applicable)

---

## 🔒 Security Best Practices

1. **Never commit secrets:**
   - All `.env*` files are in `.gitignore` ✅
   - Use Vercel environment variables only

2. **Use production keys:**
   - Switch from `pk_test_` to `pk_live_` in production
   - Use production Clerk keys for live app

3. **Enable security features:**
   - Enable email verification in Clerk
   - Set strong password requirements
   - Enable 2FA (optional but recommended)

4. **Monitor usage:**
   - Check Vercel Analytics
   - Monitor Clerk Dashboard for auth issues
   - Set up error tracking (Sentry, etc.)

---

## 📊 Monitoring & Maintenance

### Health Check Endpoint

Your app has a health check at:
```
https://your-app.vercel.app/api/health
```

Use this for monitoring services.

### Vercel Analytics

1. Go to Vercel Dashboard → Your Project → Analytics
2. Enable Analytics (if not already enabled)
3. Monitor:
   - Page views
   - Response times
   - Error rates

### Logs

View logs in Vercel Dashboard:
- **Deployments** → Select deployment → **Logs**
- Or use Vercel CLI: `vercel logs`

---

## 🎉 You're Ready!

Your app should now be live at: `https://your-app.vercel.app`

**Next Steps:**
1. Test all features thoroughly
2. Share with beta users
3. Monitor for issues
4. Set up custom domain (optional)
5. Enable analytics and monitoring

---

## Quick Reference

**Vercel Dashboard:** https://vercel.com/dashboard
**Clerk Dashboard:** https://dashboard.clerk.com
**Google Cloud Console:** https://console.cloud.google.com/

**Support:**
- Vercel Docs: https://vercel.com/docs
- Clerk Docs: https://clerk.com/docs
- Next.js Docs: https://nextjs.org/docs

