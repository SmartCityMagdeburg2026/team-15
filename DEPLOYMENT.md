# Deployment Guide - Magdeburg Pulse

This guide provides detailed instructions for deploying the Magdeburg Pulse application to various environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Cloud Platforms](#cloud-platforms)
4. [Monitoring & Logging](#monitoring--logging)
5. [Troubleshooting](#troubleshooting)
6. [Performance Optimization](#performance-optimization)

---

## Local Development

### Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your configuration
nano .env.local

# Start development server
npm run dev

# Server runs on http://localhost:8080
```

### Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start

# Server runs on http://localhost:8080
```

---

## Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 1.29+ (for multi-container setup)

### Building the Image

```bash
# Build with default tag
docker build -t magdeburg-pulse .

# Build with version tag
docker build -t magdeburg-pulse:1.0.0 .

# Build without cache (rebuild all layers)
docker build --no-cache -t magdeburg-pulse .
```

### Running Locally

```bash
# Run with default settings
docker run -p 8080:8080 magdeburg-pulse

# Run with custom environment
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e API_BASE_URL=https://api.example.com \
  magdeburg-pulse

# Run in background
docker run -d -p 8080:8080 --name magdeburg-pulse magdeburg-pulse

# View logs
docker logs -f magdeburg-pulse

# Stop container
docker stop magdeburg-pulse

# Remove container
docker rm magdeburg-pulse
```

### Docker Compose (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.9'

services:
  app:
    build: .
    container_name: magdeburg-pulse
    ports:
      - "8080:8080"
    environment:
      NODE_ENV: production
      API_BASE_URL: http://api:3000
      NEXT_PUBLIC_API_URL: http://localhost:3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  api:
    image: your-api-image:latest
    container_name: magdeburg-api
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://user:pass@db:5432/magdeburg
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    container_name: magdeburg-db
    environment:
      POSTGRES_USER: magdeburg
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: magdeburg
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

Start services:
```bash
docker-compose up -d
docker-compose logs -f app
```

---

## Cloud Platforms

### Vercel (Recommended for Next.js)

**Benefits**: Zero-config, automatic scaling, built-in analytics, edge functions

1. **Push code to GitHub**
```bash
git push origin main
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Environment**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local.example`
   - For example:
     - `NEXT_PUBLIC_API_URL`: `https://api.magdeburg.de`
     - `API_BASE_URL`: `https://api.magdeburg.de` (private)

4. **Deploy**
   - Vercel auto-deploys on push to main
   - Preview deployments for each pull request
   - Access at `https://magdeburg-pulse.vercel.app`

**Scaling**: Automatic horizontal scaling included

### Heroku

**Benefits**: Simple deployment, free tier available, integrated CI/CD

1. **Install Heroku CLI**
```bash
brew tap heroku/brew && brew install heroku
heroku login
```

2. **Create Heroku App**
```bash
heroku create magdeburg-pulse
```

3. **Configure Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set API_BASE_URL=https://api.magdeburg.de
heroku config:set NEXT_PUBLIC_API_URL=https://api.magdeburg.de
```

4. **Deploy**
```bash
git push heroku main
```

5. **View Logs**
```bash
heroku logs --tail
```

**Scaling**:
```bash
# Scale to multiple dynos
heroku ps:scale web=2

# Monitor performance
heroku metrics
```

### AWS

#### Option 1: Elastic Container Service (ECS) with Fargate

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name magdeburg-pulse --region us-east-1

# 2. Get login token and login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# 3. Build and tag image
docker build -t magdeburg-pulse:latest .
docker tag magdeburg-pulse:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/magdeburg-pulse:latest

# 4. Push to ECR
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/magdeburg-pulse:latest

# 5. Create ECS task definition, service, and cluster (via AWS Console or CLI)
```

#### Option 2: Elastic Beanstalk

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
eb init -p docker magdeburg-pulse --region us-east-1

# 3. Create environment
eb create production

# 4. Deploy
eb deploy

# 5. Open application
eb open

# 6. View logs
eb logs
```

#### Option 3: Lambda with API Gateway

Good for serverless, pay-per-use model:

```bash
# Use serverless framework
npm install -g serverless

# Deploy
serverless deploy
```

### DigitalOcean

**Benefits**: Simple, affordable, one-click deployments

1. **Create DigitalOcean App**
   - Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
   - Click "Create" → "Apps"
   - Connect GitHub repository

2. **Configure Build**
```yaml
# app.yaml
name: magdeburg-pulse
services:
- name: web
  github:
    repo: your-org/magdeburg-pulse
    branch: main
  build_command: npm run build
  run_command: npm start
  envs:
  - key: NODE_ENV
    value: production
  http_port: 8080
```

3. **Deploy**
   - Push to GitHub
   - DigitalOcean auto-deploys

### Google Cloud Run

**Benefits**: Serverless, automatic scaling, pay-per-use

```bash
# 1. Build image
gcloud builds submit --tag gcr.io/PROJECT_ID/magdeburg-pulse

# 2. Deploy to Cloud Run
gcloud run deploy magdeburg-pulse \
  --image gcr.io/PROJECT_ID/magdeburg-pulse \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,API_BASE_URL=https://api.magdeburg.de

# 3. View service
gcloud run services list
```

### Azure App Service

```bash
# 1. Create resource group
az group create --name magdeburg-rg --location eastus

# 2. Create App Service plan
az appservice plan create --name magdeburg-plan \
  --resource-group magdeburg-rg --sku B2 --is-linux

# 3. Create web app
az webapp create --resource-group magdeburg-rg \
  --plan magdeburg-plan --name magdeburg-pulse \
  --runtime "NODE|18-lts"

# 4. Deploy code
az webapp up --name magdeburg-pulse --resource-group magdeburg-rg
```

---

## Monitoring & Logging

### Application Metrics

Add monitoring to track performance:

```typescript
// src/lib/monitoring.ts
export const trackPageView = (path: string) => {
  console.log(`[PAGE VIEW] ${path}`);
  // Send to analytics service
};

export const trackError = (error: Error) => {
  console.error(`[ERROR] ${error.message}`);
  // Send to error tracking service
};
```

### Health Checks

Add health check endpoint:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}
```

### Logging

Configure logging for production:

```typescript
// src/lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const log = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
  },
};
```

### Third-party Services

#### Sentry (Error Tracking)

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### Datadog (APM)

```bash
npm install @datadog/browser-rum
```

#### Google Analytics

```typescript
// In globals.css or layout
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

### Build Fails

```bash
# Clean build
rm -rf .next node_modules
npm install
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### Environment Variables Not Loading

```bash
# Verify .env.local exists
cat .env.local

# Check Next.js environment
npm run dev -- --info

# Variables must start with NEXT_PUBLIC_ to be exposed to client
```

### Out of Memory

```bash
# Increase Node memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run build

# In Docker, allocate more memory
docker run -m 2g magdeburg-pulse
```

### Slow Performance

```bash
# Analyze bundle size
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer .next/static/chunks

# Check page performance
npx next/analyze
```

---

## Performance Optimization

### Image Optimization

```typescript
// src/components/OptimizedImage.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={630}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={false}
    />
  );
}
```

### Code Splitting

```typescript
// Dynamic imports
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  { loading: () => <p>Loading...</p> }
);
```

### Caching Strategy

```typescript
// src/app/api/data/route.ts
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const data = await fetchData();
  return Response.json(data);
}
```

### CDN Configuration

Configure Vercel Edge Network or Cloudflare:

```typescript
// next.config.ts
export default {
  images: {
    domains: ['cdn.example.com'],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

---

## Rollback Procedures

### Vercel
- View deployments: Dashboard → Deployments
- Click "Promote to Production" on previous deployment

### Heroku
```bash
heroku releases
heroku rollback v<N>
```

### Docker
```bash
docker run -p 8080:8080 magdeburg-pulse:previous-tag
```

---

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Docker Docs**: https://docs.docker.com
- **Vercel Docs**: https://vercel.com/docs
- **Node.js Best Practices**: https://nodejs.org/en/docs/guides

---

**Last Updated**: June 6, 2026
