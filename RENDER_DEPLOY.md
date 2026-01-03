# Deploying Zordr Backend to Render.com

## Quick Deploy (Recommended)

### Step 1: Sign Up

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (easiest option)

### Step 2: Create Web Service

1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the `zordr-backend--main` folder
4. Render will auto-detect Node.js

### Step 3: Configure Service

**Use these settings:**

- **Name**: `zordr-backend`
- **Region**: Choose closest (Singapore/Mumbai for India)
- **Branch**: `main`
- **Root Directory**: Leave blank OR `zordr-backend--main` if repo has multiple folders
- **Runtime**: Node
- **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start Command**: `npm start`

### Step 4: Create Database

1. Click **"New"** → **"PostgreSQL"**
2. **Name**: `zordr-db`
3. **Plan**: Free
4. Click **"Create Database"**

### Step 5: Connect Database

1. Go back to your web service
2. In **Environment** tab, add:
   ```
   DATABASE_URL = <Copy from zordr-db Internal Connection String>
   NODE_ENV = production
   JWT_SECRET = <Click Generate for secure random value>
   JWT_EXPIRES_IN = 7d
   CORS_ORIGIN = *
   ```

### Step 6: Deploy!

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for first deploy
3. Your backend will be live at: `https://zordr-backend.onrender.com`

---

## Automated Deploy (Using render.yaml)

**Even Easier Option:**

1. Commit `render.yaml` file to your repo
2. Go to Render Dashboard
3. Click **"New"** → **"Blueprint"**
4. Select your repository
5. Render automatically creates both web service AND database!

---

## After Deployment

### Test Your Backend

```bash
curl https://zordr-backend.onrender.com/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-12-04T..."
}
```

### Seed Database (First Time Only)

1. Go to Render dashboard → your service
2. Click **"Shell"**
3. Run:
   ```bash
   npx prisma db seed
   ```

---

## Update Your Apps

### Mobile App

Edit `zordr_Mobile_app/utils/api.ts`:

```typescript
const API_BASE_URL = 'https://zordr-backend.onrender.com/api';
```

### Partner App

Edit `Zordr_partner_app/.env`:

```
VITE_API_URL=https://zordr-backend.onrender.com/api
```

### Admin App

Edit `Zordr_admin_web/.env`:

```
VITE_API_URL=https://zordr-backend.onrender.com/api
```

---

## Troubleshooting

### Build Fails

- Check Render logs for errors
- Verify `package.json` has all dependencies
- Ensure Node version is compatible (18+)

### Database Connection Error

- Verify `DATABASE_URL` environment variable is set
- Check database is in same region as web service
- Run migrations: Go to Shell → `npx prisma migrate deploy`

### App Can't Connect

- Check CORS_ORIGIN is set to `*` or your domain
- Verify `/health` endpoint works
- Check firewall/network settings on client

---

## Free Tier Limitations

⚠️ **Important Notes:**

- **Cold Starts**: Free tier spins down after 15 min of inactivity (first request takes ~30 seconds)
- **Database**: Free PostgreSQL expires after 90 days (then $7/month)
- **Hours**: 750 hours/month free (enough for continuous use)

**Solutions:**

- Upgrade to paid tier ($7/month) for instant responses
- Use cron job to ping server every 10 min (keeps it awake)
- Migrate database to alternate provider after 90 days

---

## Monitoring

### View Logs

1. Go to Render dashboard
2. Click your service
3. Click **"Logs"** tab
4. Real-time logs appear here

### Check Metrics

- **Events** tab: Deployment history
- **Metrics** tab: CPU, Memory, Response times

---

## Continuous Deployment

Every time you push to `main` branch:

1. Render automatically detects changes
2. Builds new version
3. Deploys if build succeeds
4. Zero-downtime deployment!

**To disable auto-deploy:**

- Go to service **Settings**
- Toggle **"Auto-Deploy"** off

---

## Custom Domain (Optional)

Want to use your own domain? (e.g., `api.zordr.com`)

1. Go to service **Settings**
2. Click **"Add Custom Domain"**
3. Enter your domain
4. Add CNAME record to your DNS:
   ```
   CNAME api.zordr.com → zordr-backend.onrender.com
   ```
5. SSL certificate auto-generated!

---

## Need Help?

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Support**: [community.render.com](https://community.render.com)
- **Status**: [status.render.com](https://status.render.com)

---

**Your Backend URL After Deploy:**

```
https://zordr-backend.onrender.com
```

🎉 **Happy Deploying!**
