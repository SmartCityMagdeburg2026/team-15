# Magdeburg Pulse 🌆

A real-time smart city dashboard for Magdeburg that provides an overview of key urban indicators including mobility, environment, housing, and hydrology.

The goal of this project is to help citizens and decision-makers quickly understand what is happening in the city through a simple, data-driven interface.

---

## 🚀 Features

- **Home**
  - Real-time snapshot of city conditions
  - Weather, air quality, traffic, river levels
  - Recent changes and alerts

- **Mobility**
  - Traffic conditions
  - Public transport delays & MVB transit queue
  - Congestion insights & peak commuting trends

- **Environment**
  - Air quality indicators (PM2.5, AQI) by district
  - Environmental trends
  - Noise / green canopy insights

- **Housing & Affordability**
  - Average rent prices by district (€/m²)
  - Affordability metrics (rent-to-income ratio)
  - Social housing construction tracker

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
