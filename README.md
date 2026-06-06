# Magdeburg Pulse 🌆

A real-time smart city dashboard for Magdeburg that provides an overview of key urban indicators including mobility, environment, housing, and hydrology.

The goal of this project is to help citizens and decision-makers quickly understand what is happening in the city through a simple, data-driven interface.

---

## � Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Development](#development)
  - [Building](#building)
- [Deployment](#-deployment)
  - [Docker Deployment](#docker-deployment)
  - [Production Environment Variables](#production-environment-variables)
  - [Kubernetes Deployment](#kubernetes-deployment-optional)
- [API Integration](#-api-integration)
- [Data Sources](#-data-sources)
- [Architecture](#-architecture)
- [Contributing](#-contributing)

---

## 🚀 Features

### Home
- Real-time snapshot of city conditions
- Weather, air quality, traffic, river levels
- Recent changes and alerts

### Mobility
- Traffic conditions and congestion maps
- Public transport delays & MVB transit queue
- Congestion insights & peak commuting trends
- Real-time vehicle tracking

### Environment
- Air quality indicators (PM2.5, AQI) by district
- Environmental trends and forecasts
- Noise and green canopy insights
- Carbon footprint tracking

### Housing & Affordability
- Average rent prices by district (€/m²)
- Affordability metrics (rent-to-income ratio)
- Social housing construction tracker
- Price trends and forecasts

---

## 🛠 Tech Stack

- **Frontend Framework**: Next.js 16 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with PostCSS
- **Maps**: Leaflet + React Leaflet
- **Markdown**: React Markdown with Rehype Sanitize
- **Linting**: ESLint 9
- **Package Manager**: npm
- **Runtime**: Node.js 20
- **Containerization**: Docker

---

## 📁 Project Structure

```
.
├── src/                          # Source code
│   ├── app/                      # Next.js app directory
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   ├── about/                # About page
│   │   ├── api/                  # API routes
│   │   ├── environment/          # Environment feature pages
│   │   ├── housing/              # Housing feature pages
│   │   ├── mobility/             # Mobility feature pages
│   │   ├── map/                  # Map feature pages
│   │   └── globals.css           # Global styles
│   ├── components/               # Reusable React components
│   │   ├── Header.tsx            # Navigation header
│   │   ├── ai/                   # AI-related components
│   │   ├── live/                 # Live data components
│   │   ├── static/               # Static components
│   │   └── ux/                   # UX utility components
│   ├── features/                 # Feature modules
│   │   ├── environment/          # Environment feature logic
│   │   ├── housing/              # Housing feature logic
│   │   ├── insights/             # Insights feature logic
│   │   ├── map/                  # Map feature logic
│   │   └── mobility/             # Mobility feature logic
│   ├── lib/                      # Utility libraries
│   │   ├── api/                  # API clients and helpers
│   │   ├── data/                 # Data processing utilities
│   │   └── utils/                # General utilities
│   ├── config/                   # Configuration files
│   │   ├── thresholds.config.ts  # Alert thresholds
│   │   └── widgets.config.ts     # Widget configuration
│   ├── types/                    # TypeScript type definitions
│   ├── styles/                   # Global styles
│   └── widgets/                  # Widget components
├── public/                       # Static assets
├── .next/                        # Next.js build output (generated)
├── node_modules/                 # Dependencies (generated)
├── package.json                  # Project metadata and dependencies
├── package-lock.json             # Dependency lock file
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # PostCSS configuration
├── eslint.config.mjs             # ESLint configuration
├── Dockerfile                    # Docker build configuration
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Git**: for version control
- **Docker**: (optional) for containerized deployment

Check your versions:
```bash
node --version  # Should be v20.x or higher
npm --version   # Should be v10.x or higher
```

### Development

1. **Clone the repository** (if not already cloned):
```bash
git clone <repository-url>
cd team-15
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.local.example .env.local  # or manually create .env.local
```

Edit `.env.local` with your configuration:
```env
# Add your API endpoints and configuration here
API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Start the development server**:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

**Hot reload enabled**: Changes to source files will automatically reload in the browser.

### Building

Build the project for production:

```bash
npm run build
```

This generates an optimized production build in the `.next` directory.

Start the production server locally:
```bash
npm start
```

The server will run on `http://localhost:8080`

### Linting

Check and fix code quality:

```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npx eslint --fix src/
```

---

## 📦 Deployment

### Docker Deployment

The project includes a multi-stage Dockerfile for efficient containerization.

#### Build the Docker image:

```bash
docker build -t magdeburg-pulse:latest .
```

#### Run the container locally:

```bash
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e API_BASE_URL=http://localhost:3000 \
  magdeburg-pulse:latest
```

Access the app at `http://localhost:8080`

#### Push to container registry:

```bash
# Docker Hub
docker tag magdeburg-pulse:latest your-username/magdeburg-pulse:latest
docker push your-username/magdeburg-pulse:latest

# GitHub Container Registry
docker tag magdeburg-pulse:latest ghcr.io/your-org/magdeburg-pulse:latest
docker push ghcr.io/your-org/magdeburg-pulse:latest
```

### Production Environment Variables

Set these environment variables in your deployment environment:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environment mode | `production` | `production` |
| `PORT` | Server port | `8080` | `8080` |
| `HOSTNAME` | Server hostname | `0.0.0.0` | `0.0.0.0` |
| `API_BASE_URL` | Backend API base URL | - | `https://api.example.com` |
| `NEXT_PUBLIC_API_URL` | Public API URL (exposed to client) | - | `https://api.example.com` |

### Cloud Deployment Options

#### Heroku

```bash
# Create Heroku app
heroku create magdeburg-pulse

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set API_BASE_URL=https://your-api.com

# Deploy
git push heroku main
```

#### Vercel (Recommended for Next.js)

1. Push your repository to GitHub
2. Go to [vercel.com](https://vercel.com) and import your project
3. Set environment variables in Vercel dashboard
4. Deploy with one click

#### AWS

**Option 1: Elastic Container Service (ECS)**
```bash
# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag magdeburg-pulse:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/magdeburg-pulse:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/magdeburg-pulse:latest
```

**Option 2: Amplify**
- Connect your Git repository
- Configure build settings
- Auto-deploy on each push

#### DigitalOcean App Platform

```bash
# Create app.yaml in root directory
# Commit and push to trigger deployment
```

### Kubernetes Deployment (Optional)

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: magdeburg-pulse
  labels:
    app: magdeburg-pulse
spec:
  replicas: 3
  selector:
    matchLabels:
      app: magdeburg-pulse
  template:
    metadata:
      labels:
        app: magdeburg-pulse
    spec:
      containers:
      - name: magdeburg-pulse
        image: ghcr.io/your-org/magdeburg-pulse:latest
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "8080"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: magdeburg-pulse-service
spec:
  selector:
    app: magdeburg-pulse
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

Deploy to Kubernetes:
```bash
kubectl apply -f k8s/
```

---

## 🔌 API Integration

The application integrates with various data sources. Configure API endpoints in `.env.local`:

```env
# Mobility APIs
NEXT_PUBLIC_MOBILITY_API=https://api.transport.magdeburg.de/v1
NEXT_PUBLIC_TRAFFIC_API=https://api.traffic.magdeburg.de/v1

# Environment APIs
NEXT_PUBLIC_ENV_API=https://api.environment.magdeburg.de/v1
NEXT_PUBLIC_AIR_QUALITY_API=https://api.airquality.magdeburg.de/v1

# Housing APIs
NEXT_PUBLIC_HOUSING_API=https://api.housing.magdeburg.de/v1
NEXT_PUBLIC_REAL_ESTATE_API=https://api.realestate.magdeburg.de/v1
```

---

## 📊 Data Sources

The application pulls data from:

- **Magdeburg Open Data Portal** - City statistics and public data
- **MVB Mobility** - Public transport information
- **Environmental Agencies** - Air quality, noise, and environmental data
- **Real Estate Databases** - Housing and rental market data
- **Sensor Networks** - Real-time environmental sensors
- **Social Services** - Social housing and affordability data

See the [Datasources](../Datasources) folder for detailed data source documentation.

---

## 🏗 Architecture

### Frontend (Next.js)

- **Server Components**: Next.js 16 supports React Server Components for better performance
- **Route Organization**: Feature-based directory structure under `src/app/`
- **Component Library**: Reusable components in `src/components/`
- **State Management**: Context API for global state
- **Data Fetching**: Server-side and client-side rendering strategies

### Styling

- **Tailwind CSS 4**: Utility-first CSS framework
- **PostCSS**: CSS transformations and optimizations
- **Global Styles**: `src/styles/globals.css` and `src/app/globals.css`

### Performance Optimizations

- Image optimization with Next.js Image component
- Code splitting and lazy loading
- CSS optimization with Tailwind purge
- Static generation for static pages
- Incremental Static Regeneration (ISR)

---

## 📝 Configuration Files

### `next.config.ts`

Next.js configuration including image optimization and custom webpack settings.

### `tsconfig.json`

TypeScript compiler options and path aliases.

### `eslint.config.mjs`

ESLint rules for code quality. Extend with custom rules as needed.

### `postcss.config.mjs`

PostCSS plugins configuration including Tailwind CSS.

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes and commit: `git commit -m 'Add my feature'`
3. Push to branch: `git push origin feature/my-feature`
4. Open a Pull Request

### Code Quality

- Run linter before committing: `npm run lint`
- Follow TypeScript strict mode guidelines
- Write meaningful commit messages
- Add tests for new features

---

## 📄 License

See [LICENSE](./LICENSE) file for details.

---

## 📧 Support

For questions and support, please contact the development team or open an issue in the repository.

---

## 🔄 Version History

- **v0.1.0** (Current) - Initial release with mobility, environment, housing features

---

**Last Updated**: June 6, 2026


- **Map View**
  - Interactive map of Magdeburg
  - 6 layered visualizations toggles for sensor data (Transit, Air Quality, River Water level, Traffic, Schools, Canopy)

- **About**
  - Reusability & extensibility patterns
  - Technology stack details
  - Detailed open API documentation

---

## 🧠 Concept

Magdeburg Pulse is designed as a **city intelligence dashboard**:

Instead of overwhelming users with raw data, it summarizes urban conditions into a single, readable interface.

The homepage acts as a **"City Pulse"**, showing:

- What is happening right now
- What has changed recently
- What needs attention

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router, React 19)
- **Styling:** Tailwind CSS v4
- **Interactive Toggles:** 6 active IoT sensor filter layers
- **Charts:** Telemetry visualizations (SVGs)
- **Backend API Routes:** Next.js route handlers
- **Open Data Sources & APIs:**
  - **German Weather Service (DWD):** Weather forecasts
  - **European Environment Agency (EEA):** Atmospheric air quality
  - **Magdeburger Verkehrsbetriebe (MVB):** Live GTFS-RT public transit queues
  - **Pegelonline (Federal Hydrology):** Live Elbe water gauge metrics at Strombrücke

---

## 📦 Installation & Setup

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SmartCityMagdeburg2026/team-15.git
   cd team-15
   ```

2. **Navigate to the frontend folder and install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:8080](http://localhost:8080) to view the dashboard.

### Docker Deployment

1. **Build the container:**
   ```bash
   docker build -t magdeburg-pulse -f Dockerfile .
   ```

2. **Run the container (exposing port 8080):**
   ```bash
   docker run -p 8080:8080 magdeburg-pulse
   ```
