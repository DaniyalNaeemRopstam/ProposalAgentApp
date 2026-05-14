# Vercel Deployment Guide for ProposalAgent

## Prerequisites

You need to deploy **two** components:
1. **Backend (Server)** - Deploy to Railway or similar
2. **Frontend (Web App)** - Deploy to Vercel

---

## Step 1: Deploy Backend to Railway (if not already done)

The backend server needs to be running before deploying the web app.

1. Go to [railway.app](https://railway.app)
2. Create a new project from GitHub repo
3. Select the `server` directory as the root
4. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `ANTHROPIC_API_KEY`
   - `RAPIDAPI_KEY` (optional)
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `CORS_ORIGINS` (will add Vercel URL after deployment)
   - `APP_WEB_URL` (will add Vercel URL after deployment)
   
5. Railway will auto-deploy and give you a URL like: `https://your-app.up.railway.app`

**Save this Railway URL** - you'll need it for the web app.

---

## Step 2: Deploy Web App to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended for First Deployment)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   ```

6. Click "Deploy"

### Option B: Deploy via CLI

```bash
# From the project root
cd apps/web

# Login to Vercel (opens browser)
vercel login

# Deploy to production
vercel --prod

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? proposalagent-web
# - Directory? ./
# - Override settings? No
```

---

## Step 3: Update Backend CORS Settings

After deploying to Vercel, you'll get a URL like `https://proposalagent-web.vercel.app`

1. Go back to Railway dashboard
2. Update environment variables:
   ```
   CORS_ORIGINS=https://proposalagent-web.vercel.app
   APP_WEB_URL=https://proposalagent-web.vercel.app
   ```

3. Redeploy the backend

---

## Step 4: Test the Deployment

1. Visit your Vercel URL
2. Try to register a new account
3. Check if jobs are loading
4. Test AI proposal generation

---

## Common Issues

### Issue: "Failed to fetch" errors
**Solution**: Check that `NEXT_PUBLIC_API_URL` in Vercel matches your Railway backend URL exactly (no trailing slash)

### Issue: CORS errors in browser console
**Solution**: Update `CORS_ORIGINS` in Railway to include your Vercel URL

### Issue: Build fails with "Cannot find module"
**Solution**: Vercel needs to install workspace dependencies. Make sure root `package.json` has correct `postinstall` script

### Issue: Jobs not loading
**Solution**: 
- Check Railway logs for errors
- Verify `MONGODB_URI` is set correctly
- Ensure job aggregator cron is running

---

## Monorepo Configuration

Your `vercel.json` is already configured correctly:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

The root `package.json` has a `postinstall` script that builds shared packages:
```json
"postinstall": "npm run build -w @proposalagent/shared && npm run build -w @proposalagent/api-client && npm run build -w @proposalagent/ui"
```

This ensures workspace dependencies are built before the Next.js build starts.

---

## Environment Variables Summary

### Backend (Railway)
```bash
# Required
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
ANTHROPIC_API_KEY=sk-ant-xxx

# URLs (add after Vercel deployment)
CORS_ORIGINS=https://proposalagent-web.vercel.app
APP_WEB_URL=https://proposalagent-web.vercel.app

# Optional
RAPIDAPI_KEY=xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
PORT=5000
```

### Frontend (Vercel)
```bash
# Required
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app

# Optional
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## Next Steps After Deployment

1. **Test thoroughly**: Register, create proposals, check analytics
2. **Set up custom domain** (optional): In Vercel dashboard → Settings → Domains
3. **Configure Stripe webhooks**: Point to `https://your-railway-url/api/billing/webhook`
4. **Monitor logs**: 
   - Vercel: Dashboard → Project → Logs
   - Railway: Dashboard → Project → Logs
5. **Share with team**: Send them the Vercel URL to test

---

## Quick Deploy Commands

```bash
# From project root

# Deploy web app to Vercel
cd apps/web
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production
```

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Next.js Deployment**: https://nextjs.org/docs/deployment

**Common Questions**:

Q: Can I deploy both frontend and backend to Vercel?  
A: No, Vercel is optimized for Next.js frontends. The Express backend should go to Railway, Render, or AWS.

Q: Do I need to deploy the mobile app?  
A: No, mobile apps are distributed via Expo/App Store. They'll connect to the same Railway backend.

Q: How do I get a production MongoDB database?  
A: Use MongoDB Atlas (free tier available): https://www.mongodb.com/cloud/atlas

Q: What if I don't have a Stripe account yet?  
A: The app will work without Stripe. Payment features will be disabled. You can add it later.
