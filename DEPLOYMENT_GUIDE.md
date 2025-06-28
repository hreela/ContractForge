# Netlify Deployment Guide for Smart Contract Generator

## Architecture Overview
This is a full-stack application that requires:
- **Frontend**: React app (deployable to Netlify)
- **Backend**: Node.js/Express API (needs separate hosting)

## Step 1: Deploy Backend (Choose One)

### Option A: Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-detect it's a Node.js app
6. Set environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NODE_ENV`: production
7. Deploy and copy the generated URL (e.g., `https://your-app.railway.app`)

### Option B: Render
1. Go to [render.com](https://render.com)
2. Create "New Web Service"
3. Connect GitHub repository
4. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add `DATABASE_URL`
5. Deploy and copy the URL

## Step 2: Deploy Frontend to Netlify

### Method 1: Netlify CLI (Recommended)
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Build frontend: `npm run build` (this creates a `dist` folder)
3. Deploy: `netlify deploy --prod --dir=dist`
4. Set environment variable:
   - Go to Netlify dashboard → Site settings → Environment variables
   - Add `VITE_API_URL` = your backend URL from Step 1

### Method 2: Netlify Web Interface
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Configure build settings:
   - **Build command**: `vite build`
   - **Publish directory**: `dist`
   - **Environment variables**: Add `VITE_API_URL` = your backend URL
5. Deploy

## Step 3: Database Setup

### For PostgreSQL (Recommended)
1. **Neon Database** (Free tier available):
   - Go to [neon.tech](https://neon.tech)
   - Create account and new database
   - Copy connection string to `DATABASE_URL`

2. **Supabase** (Alternative):
   - Go to [supabase.com](https://supabase.com)
   - Create project
   - Get PostgreSQL connection string

## Step 4: Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
```

### Frontend (Netlify Environment Variables)
```
VITE_API_URL=https://your-backend-url.railway.app
```

## Step 5: Domain Configuration (Optional)

### Custom Domain on Netlify
1. Go to Site settings → Domain management
2. Add custom domain
3. Follow DNS configuration instructions

### Custom Domain on Railway
1. Go to your service → Settings → Domains
2. Add custom domain
3. Update your `VITE_API_URL` to use the custom domain

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Make sure your backend allows requests from your Netlify domain
2. **API Not Found**: Verify `VITE_API_URL` is set correctly
3. **Database Connection**: Check `DATABASE_URL` format and network access

### Testing Deployment:
1. Visit your Netlify URL
2. Try connecting wallet (MetaMask)
3. Test contract generation
4. Verify achievement system works

## Production Checklist
- [ ] Backend deployed and accessible
- [ ] Database connected and migrations run
- [ ] Frontend built and deployed to Netlify
- [ ] Environment variables set correctly
- [ ] Custom domain configured (if desired)
- [ ] SSL certificates active
- [ ] Achievement system functional
- [ ] Wallet connection working
- [ ] Contract generation tested

## Cost Estimates
- **Netlify**: Free tier (100GB bandwidth, unlimited sites)
- **Railway**: $5/month after free tier
- **Neon Database**: Free tier (3GB storage)
- **Domain**: ~$10-15/year (optional)

## Support
- Check console logs for errors
- Verify all environment variables are set
- Test API endpoints directly
- Contact support via the app's Telegram link