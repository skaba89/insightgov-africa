# InsightGov Africa - Render Deployment Guide

This guide explains how to deploy InsightGov Africa on Render using Docker.

## Prerequisites

1. A [Render](https://render.com) account
2. A PostgreSQL database (Render managed PostgreSQL or external)
3. GitHub repository connected to Render

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Render Cloud                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Docker    │────▶│  Next.js    │────▶│ PostgreSQL  │   │
│  │  Container  │     │   Server    │     │  Database   │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│         │                   │                               │
│         ▼                   ▼                               │
│  ┌─────────────┐     ┌─────────────┐                       │
│  │   Redis     │     │   Storage   │                       │
│  │   (Cache)   │     │  (Uploads)  │                       │
│  └─────────────┘     └─────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Create PostgreSQL Database

1. Go to Render Dashboard → New → PostgreSQL
2. Configure:
   - **Name**: `insightgov-db`
   - **Database**: `insightgov`
   - **User**: Auto-generated
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: 15 or higher
   - **Instance Type**: Free (for dev) or Starter (for production)

3. Save the **Internal Database URL** for later use.

## Step 2: Create Redis Instance (Optional but Recommended)

1. Go to Render Dashboard → New → Redis
2. Configure:
   - **Name**: `insightgov-redis`
   - **Maxmemory Policy**: `allkeys-lru`
   - **Instance Type**: Free or Starter

3. Save the **Internal Redis URL** for later use.

## Step 3: Create Web Service

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository: `skaba89/insightgov-africa`
3. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `insightgov-africa` |
   | **Region** | Same as database |
   | **Branch** | `main` |
   | **Runtime** | `Docker` |
   | **Dockerfile Path** | `./Dockerfile` |
   | **Docker Context** | `.` |
   | **Instance Type** | Starter or higher |

## Step 4: Environment Variables

Add these environment variables in Render:

### Required Variables

```bash
# Database (use Internal Database URL from Step 1)
DATABASE_URL=postgresql://user:pass@host:5432/insightgov

# Authentication
NEXTAUTH_SECRET=your-32-character-secret-minimum
NEXTAUTH_URL=https://your-app.onrender.com

# Application
NODE_ENV=production
SKIP_ENV_VALIDATION=1
```

### AI Features (Choose one)

```bash
# Option 1: Groq (Recommended - Free tier)
AI_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key

# Option 2: OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key
```

### Payment Integration (Optional)

```bash
# Paystack (Africa)
PAYSTACK_SECRET_KEY=sk_live_your-key
PAYSTACK_PUBLIC_KEY=pk_live_your-key

# Orange Money Guinea
ORANGE_MONEY_API_KEY=your-key
ORANGE_MONEY_MERCHANT_ID=your-merchant-id

# MTN Money Guinea
MTN_MONEY_API_KEY=your-key
MTN_MONEY_MERCHANT_ID=your-merchant-id
```

### Notifications (Optional)

```bash
# Africa's Talking SMS
SMS_PROVIDER=africas_talking
AFRICAS_TALKING_USERNAME=sandbox
AFRICAS_TALKING_API_KEY=your-api-key

# Email (Resend)
RESEND_API_KEY=re_your-key
```

### Monitoring (Optional)

```bash
# Sentry
SENTRY_DSN=https://your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=insightgov
SENTRY_AUTH_TOKEN=your-token

# Redis (for caching)
REDIS_URL=redis://red-xxx:6379
```

### Initial Admin Setup

```bash
# For first deployment (creates admin user)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-password
ADMIN_NAME=Admin User
```

## Step 5: Deploy

1. Click **Create Web Service**
2. Wait for the build to complete (~5-10 minutes)
3. Check logs for any errors
4. Once deployed, visit your app URL

## Step 6: Post-Deployment

### Verify Health

```bash
curl https://your-app.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123,
  "checks": {
    "database": { "status": "healthy" },
    "memory": { "status": "healthy" }
  }
}
```

### Create First Admin User

If `ADMIN_EMAIL` was set, the admin user is created automatically.
Otherwise, use the Prisma console or API to create users.

### Configure Custom Domain

1. Go to your service → Settings → Custom Domains
2. Add your domain
3. Configure DNS records as shown
4. Update `NEXTAUTH_URL` to your custom domain

## Troubleshooting

### Build Fails

1. Check Dockerfile syntax
2. Verify all dependencies in package.json
3. Check build logs for specific errors

### Database Connection Error

1. Verify `DATABASE_URL` is correct
2. Ensure database is in the same region
3. Check if database allows connections

### Memory Issues

1. Upgrade to a larger instance type
2. Reduce Node.js memory: `NODE_OPTIONS=--max-old-space-size=512`
3. Enable Redis for caching

### Health Check Failing

1. Check if port 3000 is exposed
2. Verify `/api/health` endpoint works
3. Check logs for startup errors

## Auto-Deploy Configuration

The `render.yaml` file in the repository enables Infrastructure as Code:

```yaml
services:
  - type: web
    name: insightgov-africa
    env: docker
    plan: starter
    branch: main
    dockerfilePath: ./Dockerfile
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: insightgov-db
          property: connectionString
      - key: NEXTAUTH_SECRET
        generateValue: true
      - key: NEXTAUTH_URL
        value: https://insightgov-africa.onrender.com
```

## Scaling

### Horizontal Scaling

1. Upgrade to Standard or Pro plan
2. Enable auto-scaling in settings
3. Set min/max instances

### Vertical Scaling

1. Upgrade instance type (Starter → Standard → Pro)
2. More CPU and RAM available

## Monitoring

### Built-in Monitoring

- Render Dashboard → Metrics tab
- CPU, Memory, Response time graphs
- Request logs

### External Monitoring

- **Sentry**: Error tracking (already integrated)
- **Uptime Robot**: External uptime monitoring
- **Logtail**: Log aggregation

## Backup Strategy

1. **Database**: Render automatically backs up PostgreSQL (daily on paid plans)
2. **Files**: Configure S3 or similar for persistent file storage
3. **Code**: GitHub repository serves as code backup

## Security Checklist

- [ ] `NEXTAUTH_SECRET` is set to a strong random value
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`)
- [ ] Custom domain with HTTPS enabled
- [ ] Environment variables are not exposed in logs
- [ ] Rate limiting is working (test with rapid requests)
- [ ] CSP headers are applied (check with security headers scanner)

## Support

- **Documentation**: [docs.render.com](https://docs.render.com)
- **Community**: [render.com/community](https://render.com/community)
- **Status**: [status.render.com](https://status.render.com)

---

*Last updated: April 2024*
