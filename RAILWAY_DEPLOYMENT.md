# Railway Deployment Guide for Linkup Backend

## 🚂 Step-by-Step Railway Deployment

### 1. Connect Repository to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `linkup` repository
5. Select **"Deploy Now"**

### 2. Configure Build Settings

Railway should auto-detect your Node.js project. If needed:

1. Go to **Settings** → **Build**
2. Set **Build Command**: `npm run build`
3. Set **Start Command**: `npm run start`
4. Set **Root Directory**: `irlly-backend`

### 3. Set Environment Variables

In Railway Dashboard → **Variables** tab, add these:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
JWT_SECRET=your_secure_jwt_secret_min_32_chars
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### 4. Deploy and Test

1. Railway will automatically deploy after setting variables
2. Get your deployment URL from Railway dashboard
3. Test the health endpoint: `https://your-app.railway.app/api/health`
4. Should return: `{"success": true, "message": "Linkup API is running"}`

### 5. Update Frontend API URL

Once deployed, update your frontend to use the Railway URL:

**File**: `irlly/src/services/apiService.ts`

```typescript
// Replace localhost with your Railway URL
private baseURL = 'https://your-app.railway.app/api';
```

### 6. Production Supabase Setup

1. Create new Supabase project for production
2. Copy the schema from `irlly-backend/src/database/schema.sql`
3. Run the schema in Supabase SQL editor
4. Update `DATABASE_URL` and `SUPABASE_SERVICE_KEY` in Railway

---

## 🔧 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | Supabase connection string | `postgresql://postgres:[password]@[host]:5432/postgres` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiI...` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `your-super-secure-secret-key-here` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | `your_auth_token_here` |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | `+1234567890` |

---

## 🚀 Deployment Checklist

- [ ] Repository connected to Railway
- [ ] Build settings configured
- [ ] All environment variables set
- [ ] Production Supabase project created
- [ ] Database schema imported to production
- [ ] Health endpoint responding
- [ ] Frontend API URL updated
- [ ] SMS verification tested
- [ ] CORS configured for frontend domain

---

## 🔍 Troubleshooting

### Build Fails
- Check `package.json` scripts are correct
- Ensure TypeScript compiles locally: `npm run build`
- Check Railway build logs for specific errors

### App Crashes
- Check Railway logs in dashboard
- Verify all environment variables are set
- Test database connection with Supabase

### API Not Responding
- Check Railway deployment status
- Verify PORT environment variable is set
- Test health endpoint: `/api/health`

### CORS Errors
- Add your frontend domain to ALLOWED_ORIGINS
- Include protocol: `https://your-app.com`

---

## 📊 Next Steps After Deployment

1. **Test all endpoints** with production database
2. **Update frontend** API URL and rebuild
3. **Test SMS verification** with real phone numbers
4. **Monitor Railway logs** for any issues
5. **Set up domain** (optional) via Railway custom domains

Your Linkup backend will be live at: `https://your-app.railway.app` 🎉