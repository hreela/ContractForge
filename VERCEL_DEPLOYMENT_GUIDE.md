# Vercel Deployment Guide
## Deploy Smart Contracts Without Coding - Complete Setup

### 🚀 Overview
This guide covers deploying your smart contract generator to Vercel with:
- **Frontend**: React + TypeScript (Vite)
- **Backend**: Node.js serverless functions
- **Database**: PostgreSQL (Neon/Supabase)
- **Deployment**: One-click deployment with Git integration

Vercel is ideal for this project because it:
- Provides free hosting for frontend and API
- Offers automatic deployments on git push
- Includes built-in serverless functions
- Has excellent performance optimization

---

## 📋 Prerequisites

Before starting:
- [ ] GitHub account with your repository
- [ ] Vercel account (free)
- [ ] PostgreSQL database (Neon recommended)

---

## 🔧 Step 1: Prepare Project Structure

### 1.1 Create Vercel Configuration

Your `vercel.json` is already created with the correct configuration for:
- Static frontend builds
- API routes handling
- Environment variable management
- Node.js runtime settings

### 1.2 Update Package.json Scripts

Add Vercel-specific build commands:

```json
{
  "scripts": {
    "build": "vite build",
    "vercel-build": "vite build",
    "dev": "NODE_ENV=development tsx server/index.ts",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

### 1.3 Create API Routes for Vercel

Vercel uses file-based API routes. Create the API structure:

```
api/
├── contracts/
│   ├── index.ts
│   ├── [id].ts
│   └── deploy.ts
├── features/
│   └── pricing.ts
├── achievements/
│   ├── index.ts
│   └── user.ts
└── health.ts
```

---

## 🗄️ Step 2: Setup Database

### Option A: Neon Database (Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create project: "smart-contract-generator"
4. Copy connection string
5. Save for environment variables

### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get PostgreSQL connection string
4. Save for environment variables

### 2.1 Database Schema Setup

Your database schema is already defined in `shared/schema.ts`. For production, you'll need to run migrations:

```sql
-- Create tables based on your Drizzle schema
-- This will be handled automatically by your application
```

---

## 🚀 Step 3: Deploy to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your repository

2. **Configure Project**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Environment Variables**
   Add these in project settings:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Get your live URL (e.g., `https://your-project.vercel.app`)

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow prompts to configure
# Set environment variables
vercel env add DATABASE_URL
vercel env add NODE_ENV production

# Deploy to production
vercel --prod
```

---

## 🔄 Step 4: Configure API Routes

### 4.1 Create Health Check Endpoint

Create `api/health.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
}
```

### 4.2 Create Contract API Routes

Create `api/contracts/index.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { storage } from '../../../server/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get contracts
    const contracts = await storage.getContractsByDeployer(req.query.deployer as string);
    res.status(200).json(contracts);
  } else if (req.method === 'POST') {
    // Create contract
    const contract = await storage.createContract(req.body);
    res.status(201).json(contract);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
```

### 4.3 Create Feature Pricing API

Create `api/features/pricing.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { storage } from '../../../server/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const pricing = await storage.getAllFeaturePricing();
    res.status(200).json(pricing);
  } else if (req.method === 'PUT') {
    const updated = await storage.updateFeaturePricing(
      req.body.featureName,
      req.body.updates,
      req.body.updatedBy
    );
    res.status(200).json(updated);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
```

---

## 🔐 Step 5: Environment Variables

### 5.1 Required Environment Variables

Set these in Vercel dashboard (Settings → Environment Variables):

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-project.vercel.app

# Optional: Web3 Configuration
POLYGON_RPC_URL=https://polygon-rpc.com
```

### 5.2 Frontend Environment Variables

Update your frontend to use Vercel's environment variables:

```typescript
// client/src/lib/constants.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
```

---

## 🌐 Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain
1. Go to project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS settings as instructed
5. SSL certificate is automatic

### 6.2 DNS Configuration
For domain `deploycontracts.com`:
```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## 🧪 Step 7: Testing Deployment

### 7.1 Frontend Testing
Visit your Vercel URL and verify:
- [ ] Site loads correctly
- [ ] Wallet connection works
- [ ] Contract generation form functions
- [ ] Feature selection works
- [ ] Pricing calculations display
- [ ] Achievement system loads

### 7.2 API Testing
Test your API endpoints:

```bash
# Health check
curl https://your-project.vercel.app/api/health

# Feature pricing
curl https://your-project.vercel.app/api/features/pricing

# Contracts (requires authentication)
curl -X POST https://your-project.vercel.app/api/contracts \
  -H "Content-Type: application/json" \
  -d '{"name":"TestToken","symbol":"TEST"}'
```

---

## 🔧 Step 8: Optimize Performance

### 8.1 Configure Vercel Settings

Create `vercel.json` optimization:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/index.html",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist",
        "zeroConfig": true
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs18.x",
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### 8.2 Enable Analytics
1. Go to project settings
2. Navigate to "Analytics"
3. Enable Web Analytics
4. Monitor Core Web Vitals

---

## 🚨 Troubleshooting

### Common Issues & Solutions

**1. Build Failures**
```
Error: Build failed with exit code 1
```
**Solution**: Check Node.js version and dependencies
```bash
# Update Node.js version in vercel.json
"functions": {
  "api/**/*.ts": {
    "runtime": "nodejs18.x"
  }
}
```

**2. API Routes Not Working**
```
Error: 404 - API route not found
```
**Solution**: Verify file structure matches Vercel's requirements
```
api/
├── contracts/
│   └── index.ts
└── health.ts
```

**3. Database Connection Issues**
```
Error: Connection terminated unexpectedly
```
**Solution**: Check DATABASE_URL format and connection limits
```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

**4. Environment Variables Not Loading**
```
Error: process.env.DATABASE_URL is undefined
```
**Solution**: Ensure variables are set in Vercel dashboard and properly prefixed

### Debug Commands

```bash
# Check deployment logs
vercel logs

# View environment variables
vercel env ls

# Redeploy with fresh build
vercel --prod --force
```

---

## 📊 Monitoring & Analytics

### 8.1 Performance Monitoring
- **Vercel Analytics**: Built-in Web Vitals tracking
- **Function Metrics**: Cold start times, execution duration
- **Error Tracking**: Automatic error reporting

### 8.2 Database Monitoring
- **Connection Pooling**: Monitor active connections
- **Query Performance**: Slow query detection
- **Usage Metrics**: Storage and bandwidth usage

---

## 💰 Cost Analysis

### Vercel Pricing
| Feature | Free (Hobby) | Pro ($20/month) |
|---------|--------------|-----------------|
| **Deployments** | 100/month | Unlimited |
| **Bandwidth** | 100GB | 1TB |
| **Function Executions** | 100GB-hrs | 1000GB-hrs |
| **Custom Domains** | ✅ | ✅ |
| **Analytics** | Basic | Advanced |

### Database Costs
- **Neon**: Free tier (3GB storage)
- **Supabase**: Free tier (500MB database)

**Total Monthly Cost**: $0-20 (free tier sufficient for most projects)

---

## 🔄 CI/CD & Automation

### 9.1 Automatic Deployments
Vercel automatically deploys on:
- Push to main branch → Production
- Pull requests → Preview deployments
- Branch commits → Development deployments

### 9.2 Preview Deployments
Every pull request gets a unique preview URL:
```
https://your-project-git-feature-branch.vercel.app
```

### 9.3 Rollback Strategy
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

---

## 🎯 Production Checklist

### Pre-Launch
- [ ] Repository connected to Vercel
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] API routes tested
- [ ] Frontend build successful
- [ ] Custom domain configured (optional)

### Post-Launch
- [ ] Analytics enabled
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] Backup procedures established
- [ ] Documentation updated

### Security
- [ ] Environment variables secured
- [ ] API rate limiting implemented
- [ ] CORS configured properly
- [ ] Security headers enabled
- [ ] SSL certificate active

---

## 🎉 Success Metrics

Your Vercel deployment is successful when:
- ✅ Build completes without errors
- ✅ All API routes respond correctly
- ✅ Database connections work
- ✅ Web3 integration functional
- ✅ Core Web Vitals score > 90
- ✅ Page load time < 2 seconds

---

## 📞 Support Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel API Routes](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

### Community
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Discord](https://discord.gg/vercel)

### Your Project Support
- Telegram: https://t.me/+hrP23f7XcBdiOTRl
- Email: hreela@gmail.com

---

## 🚀 Next Steps

After successful deployment:
1. **Monitor Performance**: Use Vercel Analytics
2. **Scale Database**: Upgrade if needed
3. **Add Features**: Implement new contract types
4. **Optimize**: Bundle size and performance
5. **Marketing**: Share your deployment URL

---

*Your "Deploy Smart Contracts Without Coding" platform is now live on Vercel with enterprise-grade performance and reliability!*