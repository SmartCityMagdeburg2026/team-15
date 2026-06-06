# Quick Start Guide

Get the Magdeburg Pulse dashboard running in minutes.

## ⚡ 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.local.example .env.local
# Edit .env.local with your API endpoints
```

### 3. Run Development Server
```bash
npm run dev
```

→ Open [http://localhost:8080](http://localhost:8080)

---

## 📦 Common Commands

### Development
```bash
npm run dev              # Start dev server (port 8080, auto-reload)
npm run build            # Build for production
npm run start            # Run production build locally
npm run lint             # Check code quality
npx eslint --fix src/    # Auto-fix linting issues
```

### Docker
```bash
docker build -t magdeburg-pulse .
docker run -p 8080:8080 magdeburg-pulse
```

### Deployment
- **Vercel (recommended)**: Push to GitHub, auto-deploys
- **Heroku**: `git push heroku main`
- **Docker**: `docker build . && docker run -p 8080:8080 ...`
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for more platforms

---

## 🐛 Troubleshooting

### Port 8080 Already in Use
```bash
lsof -i :8080 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
npm run dev
```

### Clean Rebuild
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Loading
- Verify `.env.local` exists in project root
- Variables must start with `NEXT_PUBLIC_` to be exposed to client
- Restart dev server after changing `.env.local`

---

## 📖 Documentation

- **[README.md](./README.md)** - Full project documentation
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Detailed deployment guides
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contributing guidelines
- **[Datasources](../Datasources)** - Data source documentation

---

## 🚀 Next Steps

1. ✅ Set up local development
2. ⬜ Configure API endpoints in `.env.local`
3. ⬜ Explore features in development mode
4. ⬜ Run tests: `npm test` (if tests exist)
5. ⬜ Deploy to production (see [DEPLOYMENT.md](./DEPLOYMENT.md))

---

**Need help?** Check [CONTRIBUTING.md](./CONTRIBUTING.md#getting-help) for support channels.
