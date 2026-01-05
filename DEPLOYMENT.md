# ColdEmailCrafter Deployment Guide

## Architecture

- **Frontend**: Cloudflare Pages (React + Vite)
- **Backend**: Railway (Node.js + Express API)
- **Database**: None (stateless application)

---

## Prerequisites

- GitHub repository with your code
- Railway account ([railway.app](https://railway.app))
- Cloudflare account ([cloudflare.com](https://cloudflare.com))
- OpenAI API key

---

## Step 1: Deploy Backend to Railway

### Option A: Via Railway Dashboard (Recommended)

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `ColdEmailCrafter` repository
4. Railway will auto-detect the Dockerfile
5. Add environment variables in Railway dashboard:
   - `OPENAI_API_KEY` = your OpenAI API key (starts with `sk-`)
   - `NODE_ENV` = `production`
   - `PORT` = Railway sets this automatically (defaults to 3000)
   - `CORS_ORIGINS` = leave empty for now (we'll set after frontend deployment)

6. Wait for deployment to complete
7. Note your Railway URL (e.g., `https://cold-email-crafter-production.up.railway.app`)

### Option B: Via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Set environment variables
railway variables set OPENAI_API_KEY="sk-your-key-here"
railway variables set NODE_ENV="production"

# Deploy
railway up
```

### Verify Backend

Test the health endpoint:
```bash
curl https://your-app.up.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "environment": "production"
}
```

---

## Step 2: Deploy Frontend to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages**
2. Click **"Create a project"** → **"Connect to Git"**
3. Select your GitHub account and `ColdEmailCrafter` repository
4. Configure build settings:
   - **Project name**: `cold-email-crafter` (or your choice)
   - **Production branch**: `main` (or your default branch)
   - **Root directory** (Path): `/` (repo root, not `/client`)
   - **Build command**: `npm run build:client`
   - **Build output directory**: `client/dist` (relative to repo root)
   - **Deploy command**: `echo "Deploy handled by Cloudflare Pages"` (or leave empty if possible)
   - **Node version**: `20` (or latest LTS)

5. Add environment variables:
   - `VITE_API_URL` = your Railway backend URL (e.g., `https://cold-email-crafter-production.up.railway.app`)
   - **Important**: No trailing slash!

6. Click **"Save and Deploy"**
7. Wait for deployment to complete
8. Note your Cloudflare Pages URL (e.g., `https://cold-email-crafter.pages.dev`)

---

## Step 3: Update Railway CORS

After Cloudflare Pages is deployed, update Railway CORS to allow your frontend:

1. Go to Railway dashboard → Your project → Variables
2. Add/update `CORS_ORIGINS`:
   ```
   https://cold-email-crafter.pages.dev
   ```
   (Use your actual Cloudflare Pages URL)

3. Railway will automatically redeploy

**Note**: If you have a custom domain, add both:
```
https://cold-email-crafter.pages.dev,https://yourdomain.com
```

---

## Step 4: Verify Deployment

1. **Frontend**: Visit your Cloudflare Pages URL
2. **Test email generation**: Fill out the form and generate emails
3. **Test email analysis**: Check that metrics load correctly
4. **Check browser console**: No CORS errors should appear

---

## Environment Variables Summary

### Railway (Backend)
- `OPENAI_API_KEY` - Required
- `NODE_ENV` - `production`
- `PORT` - Auto-set by Railway
- `CORS_ORIGINS` - Your Cloudflare Pages URL(s)

### Cloudflare Pages (Frontend)
- `VITE_API_URL` - Your Railway backend URL (no trailing slash)

---

## Custom Domain Setup

### Cloudflare Pages Custom Domain

1. In Cloudflare Pages dashboard → Your project → **Custom domains**
2. Add your domain
3. Follow DNS instructions (usually a CNAME record)

### Railway Custom Domain

1. In Railway dashboard → Your project → **Settings** → **Domains**
2. Add your custom domain
3. Add CNAME record at your DNS provider pointing to Railway

**Remember**: Update `CORS_ORIGINS` in Railway to include your custom domain!

---

## Troubleshooting

### CORS Errors

- Verify `CORS_ORIGINS` in Railway includes your Cloudflare Pages URL
- Check that `VITE_API_URL` in Cloudflare Pages is correct (no trailing slash)
- Ensure Railway backend is running (check `/health` endpoint)

### Frontend Can't Connect to Backend

- Verify `VITE_API_URL` environment variable in Cloudflare Pages
- Check browser console for exact error message
- Test backend directly: `curl https://your-railway-url.up.railway.app/health`

### Build Failures

**Cloudflare Pages:**
- Ensure `Path` (Root directory) is set to `/client`
- Verify `Build command` is `npm run build:client`
- Build output will be in `dist` (relative to `/client`, so `client/dist`)

**Railway:**
- Check Dockerfile is in project root
- Verify `package.json` has `build:server` script
- Check Railway build logs for errors

---

## Local Development

For local development, the frontend will use relative URLs (Vite proxy):

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend (if needed separately)
cd client && npm run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:5000` automatically.

---

## Cost Estimate

- **Railway**: ~$5/month (with $5 free credit)
- **Cloudflare Pages**: Free (unlimited requests)
- **Total**: ~$5/month or less

---

## Rollback Plan

1. **Railway**: Use Railway dashboard → Deployments → Rollback to previous version
2. **Cloudflare Pages**: Use Cloudflare dashboard → Pages → Deployments → Retry deployment

Keep your Replit deployment running until you've verified the new setup for at least 1 week.

