# 🚀 Deploy ProposalAgent (5-Minute Guide)

## Step 1: Deploy Backend to Railway (3 minutes)

### 1a. Push code to GitHub (if not already done)
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 1b. Deploy to Railway

1. **Go to**: https://railway.app/new
2. **Click**: "Deploy from GitHub repo"
3. **Select**: Your `proposalagent` repository
4. **Configure Project**:
   - Service Name: `proposalagent-backend`
   - Root Directory: **Leave as `/` (repository root)**
   - Dockerfile Path: `server/Dockerfile`
   
5. **Add Environment Variables** (click "Variables" tab):
   ```bash
   # Required
   MONGODB_URI=mongodb+srv://your-connection-string
   JWT_SECRET=your-secret-key-min-32-chars
   ANTHROPIC_API_KEY=sk-ant-your-key
   
   # Recommended
   RAPIDAPI_KEY=your-rapidapi-key
   NODE_ENV=production
   PORT=5000
   
   # Will update after frontend deployment
   CORS_ORIGINS=https://your-app.vercel.app
   APP_WEB_URL=https://your-app.vercel.app
   
   # Optional (Stripe)
   STRIPE_SECRET_KEY=sk_live_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   STRIPE_PRICE_SOLO=price_xxx
   STRIPE_PRICE_PRO=price_xxx
   STRIPE_PRICE_ENTERPRISE=price_xxx
   ```

6. **Click**: "Deploy"
7. **Wait**: 2-3 minutes for build
8. **Copy your Railway URL**: `https://proposalagent-backend-production.up.railway.app`
   - Find it under "Settings" → "Networking" → "Public Networking"

---

## Step 2: Deploy Frontend to Vercel (2 minutes)

### Option A: Via Vercel CLI (Fastest)

Run this from your terminal:

```bash
cd apps/web

# Set the backend URL as environment variable
vercel env add NEXT_PUBLIC_API_URL production

# When prompted, paste your Railway URL:
# https://proposalagent-backend-production.up.railway.app

# Deploy to production
vercel --prod

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name? proposalagent-web
# - Override settings? No
```

### Option B: Via Vercel Dashboard

1. **Go to**: https://vercel.com/new
2. **Import**: Your GitHub repository
3. **Configure**:
   - Framework: Next.js
   - Root Directory: `apps/web`
   - Build Command: `npm run build`
   - Install Command: `npm install`
4. **Environment Variables**:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
   ```
5. **Deploy**

---

## Step 3: Update Backend CORS (1 minute)

After getting your Vercel URL (e.g., `https://proposalagent-web.vercel.app`):

1. Go back to **Railway Dashboard**
2. Click your backend service
3. Go to **Variables** tab
4. Update these variables:
   ```bash
   CORS_ORIGINS=https://proposalagent-web.vercel.app
   APP_WEB_URL=https://proposalagent-web.vercel.app
   ```
5. Railway will auto-redeploy

---

## Step 4: Test Your Deployment ✅

1. Visit your Vercel URL
2. Register a new account
3. Check if jobs load
4. Try generating an AI proposal
5. Share the URL with your team!

---

## 🔥 Quick Deploy Commands (Copy-Paste)

```bash
# From project root

# 1. Commit and push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# 2. Deploy frontend to Vercel
cd apps/web
vercel env add NEXT_PUBLIC_API_URL production
# (paste your Railway URL when prompted)
vercel --prod

# 3. Get your URLs
vercel ls

# Done! 🎉
```

---

## What You'll Get

After deployment, you'll have:

- ✅ **Backend**: `https://proposalagent-backend-production.up.railway.app`
- ✅ **Frontend**: `https://proposalagent-web.vercel.app`
- ✅ **Mobile App**: Will connect to the same Railway backend (no deployment needed)

---

## Troubleshooting

### ❌ Build fails on Railway
- Check that Root Directory is `/` (repository root)
- Verify Dockerfile Path is `server/Dockerfile`
- Check environment variables are set

### ❌ "Failed to fetch" on frontend
- Verify `NEXT_PUBLIC_API_URL` matches Railway URL exactly
- No trailing slash on the URL
- Check Railway service is running (green status)

### ❌ CORS errors in browser
- Update `CORS_ORIGINS` in Railway to include Vercel URL
- Wait 1-2 minutes for Railway to redeploy
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)

### ❌ Jobs not loading
- Check Railway logs for errors
- Verify MongoDB connection string is correct
- Ensure `ANTHROPIC_API_KEY` is set

---

## Environment Variables Checklist

### Railway (Backend) ✅
- [x] MONGODB_URI
- [x] JWT_SECRET
- [x] ANTHROPIC_API_KEY
- [x] CORS_ORIGINS (add after Vercel deployment)
- [x] APP_WEB_URL (add after Vercel deployment)
- [ ] RAPIDAPI_KEY (optional)
- [ ] STRIPE_SECRET_KEY (optional)

### Vercel (Frontend) ✅
- [x] NEXT_PUBLIC_API_URL (Railway URL)
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (optional)

---

## Next Steps

1. **Set up custom domain** (optional)
   - Vercel: Settings → Domains
   - Railway: Settings → Networking → Custom Domain

2. **Configure Stripe webhooks**
   - Endpoint: `https://your-railway-url/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

3. **Monitor logs**
   - Railway: Dashboard → Logs
   - Vercel: Dashboard → Logs

4. **Invite team members**
   - Share the Vercel URL
   - They can register and test

---

## Support

If you run into issues:
- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Check logs** in both dashboards for error messages
