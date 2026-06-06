"use client";

import { useEffect, useState, useRef } from "react";

// Minimal, safe markdown renderer for bot replies: supports **bold**, *italic*, and line breaks.
function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderMarkdownToHtml(text: string) {
  const safe = escapeHtml(text);
  let html = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/\n/g, "<br/>");
  return html;
}
import MobilityScreen from "@/features/mobility/MobilityScreen";
import EnvironmentScreen from "@/features/environment/EnvironmentScreen";
import RentByDistrict from "@/features/housing/affordability/RentByDistrict";

// Types matching the backend API
interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  comparison?: string;
}

interface AirQualityData {
  aqi: number;
  status: string;
  pm25: number;
  pm10: number;
  comparison?: string;
}

interface TransitData {
  status: string;
  delays: { line: string; delay: string; status: string }[];
}

// Custom SVGs & Icons

// Fix: ensure className appends correctly instead of overriding dimensions
const ArrowUpRight = ({ className = "" }: { className?: string }) => (
  <svg className={`w-3.5 h-3.5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"></line>
    <polyline points="7 7 17 7 17 17"></polyline>
  </svg>
);

const ArrowDownRight = ({ className = "" }: { className?: string }) => (
  <svg className={`w-3.5 h-3.5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="7" x2="17" y2="17"></line>
    <polyline points="17 7 17 17 7 17"></polyline>
  </svg>
);

const LeafIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 3a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9s9-4.03 9-9a9 9 0 0 0-9-9z" />
    <path d="M12 3v18" />
    <path d="M12 12c2-2 5-2 5-2s0 3-2 5" />
    <path d="M12 12c-2-2-5-2-5-2s0 3 2 5" />
  </svg>
);

const GlobeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const RefreshIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

const PartlyCloudyIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
    {/* Sun */}
    <circle cx="15" cy="8" r="3.5" fill="#FBBF24" />
    {/* Ray lines */}
    <path d="M15 2.5V4M15 12v1.5M9.5 8H11M19 8h1.5" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
    {/* Cloud */}
    <path d="M17 15.5A2.5 2.5 0 0 0 17.5 10.5H17.1a3.5 3.5 0 0 0 -6.8 1A2.5 2.5 0 0 0 11 16.5h6z" fill="#CBD5E1" />
  </svg>
);

const BusIcon = () => (
  <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center text-white">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <rect x="4" y="6" width="16" height="10" rx="2" />
      <path d="M6 16v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2" />
      <path d="M15 16v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2" />
      <circle cx="7.5" cy="11.5" r="1.2" fill="currentColor" />
      <circle cx="16.5" cy="11.5" r="1.2" fill="currentColor" />
    </svg>
  </div>
);

const WarningIcon = () => (
  <div className="w-10 h-10 flex items-center justify-center text-orange-500">
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V8h2v4z" />
    </svg>
  </div>
);

const WaveIcon = () => (
  <div className="w-10 h-10 flex flex-col items-center justify-center gap-0.5 text-blue-500">
    <svg className="w-7 h-4" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M2 3 C 5 1, 8 1, 11 3 S 17 5, 22 3" />
      <path d="M2 6 C 5 4, 8 4, 11 6 S 17 8, 22 6" />
      <path d="M2 9 C 5 7, 8 7, 11 9 S 17 11, 22 9" />
    </svg>
  </div>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState<"city-pulse" | "mobility" | "environment" | "housing" | "map" | "about" | "reports">("city-pulse");
  const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false);

  // 1. Weather now state
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 18,
    condition: "Partly cloudy",
    humidity: 62,
    windSpeed: 14.5
  });

  // 2. Air quality state
  const [aqi, setAqi] = useState<AirQualityData>({
    aqi: 42,
    status: "Good",
    pm25: 9.4,
    pm10: 18.2,
    comparison: "Slightly better than yesterday"
  });

  // 3. Mobility status state
  const [mobilityStatus, setMobilityStatus] = useState({
    status: "Good",
    desc: "Normal traffic flow across the city.",
    comparison: "Slightly better than yesterday"
  });

  // 4. Traffic disruptions state
  const [traffic, setTraffic] = useState({
    activeCount: 2,
    desc: "Two incidents causing delays.",
    comparison: "Slightly worse than yesterday"
  });

  // 5. Elbe level state
  const [elbe, setElbe] = useState({
    level: 2.35,
    level_cm: 235,
    status: "Normal",
    desc: "Below flood warning level (4.50 m).",
    comparison: "0.08 m vs yesterday"
  });

  const [lastUpdatedText, setLastUpdatedText] = useState("Updated 8 min ago");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Computed Pulse Index state
  const [pulseIndex, setPulseIndex] = useState({
    score: 81,
    prevScore: 77,
    airDelta: 3,
    mobilityDelta: 2,
    trafficDelta: -1
  });

  // Dynamic City Pulse Log Feed
  const [pulseLogs, setPulseLogs] = useState<{ icon: string; title: string; tag: string; tagColor: string; desc: string }[]>([]);

  // Transit delay list state (Mobility sub-tab queue)
  const [transitDelays, setTransitDelays] = useState<{ line: string; delay: string; status: string }[]>([
    { line: "Tram 1", delay: "3 min", status: "Minor Delay" },
    { line: "Tram 9", delay: "0 min", status: "On Time" },
    { line: "Bus 51", delay: "7 min", status: "Delayed" },
    { line: "Bus 54", delay: "0 min", status: "On Time" }
  ]);

  // Map popup states
  const [selectedMapPin, setSelectedMapPin] = useState<{
    id: string;
    title: string;
    description: string;
    metricLabel: string;
    metricValue: string;
    status: string;
    statusColor: string;
  } | null>(null);

  // Active Map Filter Layers
  const [mapFilters, setMapFilters] = useState({
    airQuality: true,
    traffic: true,
    floodRisk: true,
    schools: true,
    greenAreas: true,
    publicTransport: true
  });

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([
    { sender: "bot", text: "Hello! I am Ask Otto, your Magdeburg city assistant. Ask me about weather, transit, air quality, or projects." }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  async function performTelemetrySync() {
    // Local accumulators for pulse index computation
    let latestWeather: WeatherData = { temperature: 18, condition: "Partly cloudy", humidity: 62, windSpeed: 14.5 };
    let latestAqi: AirQualityData  = { aqi: 42, status: "Good", pm25: 9.4, pm10: 18.2 };
    let latestTransit: TransitData = { status: "Minor Delays", delays: [] };
    let histAqi: AirQualityData | null = null;
    let histTransit: TransitData | null = null;
    let latestElbe = { level: 2.35, status: "Normal" };

    // 1. Weather now & yesterday comparison
    try {
      const [res, histRes] = await Promise.all([
        fetch("/api/weather"),
        fetch("/api/weather?history=true")
      ]);
      if (res.ok) {
        const data: WeatherData = await res.json();
        latestWeather = data;
        let comp = "Stable vs yesterday";
        if (histRes.ok) {
          const histData: WeatherData = await histRes.json();
          const diff = data.temperature - histData.temperature;
          comp = diff === 0 ? "Same temperature as yesterday" : `${Math.abs(diff)}°C ${diff > 0 ? "warmer" : "cooler"} than yesterday`;
        }
        setWeather({
          temperature: Math.round(data.temperature),
          condition: data.condition,
          humidity: data.humidity,
          windSpeed: data.windSpeed,
          comparison: comp
        });
      }
    } catch (err) {
      console.error("Weather telemetry sync failed:", err);
    }

    // 2. Air quality now & yesterday comparison
    try {
      const [res, histRes] = await Promise.all([
        fetch("/api/air-quality"),
        fetch("/api/air-quality?history=true")
      ]);
      if (res.ok) {
        const data: AirQualityData = await res.json();
        latestAqi = data;
        let comp = "Stable vs yesterday";
        if (histRes.ok) {
          const histData: AirQualityData = await histRes.json();
          histAqi = histData;
          const diff = data.aqi - histData.aqi;
          if (diff === 0) comp = "Same AQI as yesterday";
          else comp = `${Math.abs(diff)} AQI pts ${diff < 0 ? "better" : "worse"} than yesterday`;
        }
        setAqi({
          aqi: data.aqi,
          status: data.status,
          pm25: data.pm25,
          pm10: data.pm10,
          comparison: comp
        });
      }
    } catch (err) {
      console.error("AQI telemetry sync failed:", err);
    }

    // 3. Transit & Mobility score with yesterday comparison
    try {
      const [res, histRes] = await Promise.all([
        fetch("/api/transit"),
        fetch("/api/transit?history=true")
      ]);
      if (res.ok) {
        const data: TransitData = await res.json();
        latestTransit = data;
        setTransitDelays(data.delays);

        const delayCount = data.delays.filter(d => d.delay !== "0 min").length;
        
        let trafficComp = "No delays active";
        if (histRes.ok) {
          const histData: TransitData = await histRes.json();
          histTransit = histData;
          const histDelayCount = histData.delays.filter(d => d.delay !== "0 min").length;
          const diff = delayCount - histDelayCount;
          if (diff === 0) trafficComp = "Same delays as yesterday";
          else trafficComp = `${Math.abs(diff)} ${diff > 0 ? "more" : "fewer"} delayed line${Math.abs(diff) > 1 ? "s" : ""} than yesterday`;
        }
        setTraffic({
          activeCount: delayCount,
          desc: `${delayCount} line${delayCount !== 1 ? "s" : ""} with delays.`,
          comparison: trafficComp
        });

        // Calculate mobility score & status dynamically
        const totalLines = data.delays.length;
        const onTimeLines = totalLines - delayCount;
        const transitScoreVal = totalLines > 0 ? (onTimeLines / totalLines) * 100 : 90;
        let disruptionScoreVal = 100;
        if (delayCount === 0) disruptionScoreVal = 100;
        else if (delayCount <= 2) disruptionScoreVal = 80;
        else if (delayCount <= 4) disruptionScoreVal = 60;
        else if (delayCount <= 6) disruptionScoreVal = 40;
        else disruptionScoreVal = 20;

        const comfortScoreVal = 85;
        const overallScore = 0.5 * transitScoreVal + 0.3 * disruptionScoreVal + 0.2 * comfortScoreVal;

        let histOverallScore = 80;
        if (histTransit) {
          const histDelayCount = histTransit.delays.filter(d => d.delay !== "0 min").length;
          const histTotalLines = histTransit.delays.length;
          const histOnTimeLines = histTotalLines - histDelayCount;
          const histTransitScoreVal = histTotalLines > 0 ? (histOnTimeLines / histTotalLines) * 100 : 90;
          let histDisruptionScoreVal = 100;
          if (histDelayCount === 0) histDisruptionScoreVal = 100;
          else if (histDelayCount <= 2) histDisruptionScoreVal = 80;
          else if (histDelayCount <= 4) histDisruptionScoreVal = 60;
          else if (histDelayCount <= 6) histDisruptionScoreVal = 40;
          else histDisruptionScoreVal = 20;
          histOverallScore = 0.5 * histTransitScoreVal + 0.3 * histDisruptionScoreVal + 0.2 * comfortScoreVal;
        }

        let statusLabel = "Good";
        let statusDesc = "Normal traffic flow across the city.";
        if (overallScore >= 80) {
          statusLabel = "Good";
          statusDesc = "Getting around feels mostly smooth today.";
        } else if (overallScore >= 65) {
          statusLabel = "Moderate";
          statusDesc = "Getting around is manageable today, with a few local slowdowns.";
        } else if (overallScore >= 50) {
          statusLabel = "Fair";
          statusDesc = "Getting around may take a bit longer today in some areas.";
        } else {
          statusLabel = "Poor";
          statusDesc = "Getting around feels more difficult than usual today.";
        }

        const scoreDiff = Math.round(overallScore) - Math.round(histOverallScore);
        let mobComp = "Same as yesterday";
        if (scoreDiff !== 0) {
          mobComp = `${scoreDiff > 0 ? "Better" : "Worse"} than yesterday (Score: ${Math.round(overallScore)} vs ${Math.round(histOverallScore)})`;
        } else {
          mobComp = `Score: ${Math.round(overallScore)}/100 (same as yesterday)`;
        }

        setMobilityStatus({
          status: statusLabel,
          desc: statusDesc,
          comparison: mobComp
        });
      }
    } catch (err) {
      console.error("Mobility telemetry sync failed:", err);
    }

    // 4. Elbe hydrology (internal proxy -> Pegelonline)
    try {
      const [res, histRes] = await Promise.all([
        fetch("/api/water-level"),
        fetch("/api/water-level?history=true")
      ]);
      if (res.ok) {
        const data = await res.json();
        // Prefer `value_m` if present; otherwise derive from cm fields
        const currentLevelMeters = data.value_m != null ? Number(data.value_m) : Number(data.value ?? data.value_cm ?? 0) / 100;
        const currentLevelCm = data.value_cm != null ? Number(data.value_cm) : data.value != null ? Number(data.value) : Math.round(currentLevelMeters * 100);
        let statusText = "Normal";
        let descText = "Below flood warning level (4.50 m).";
        if (currentLevelMeters >= 4.5) {
          statusText = "Flood Warning";
          descText = "Above flood warning level (4.50 m).";
        } else if (currentLevelMeters <= 1.0) {
          statusText = "Low Water";
          descText = "Below normal low water mark.";
        }
        latestElbe = { level: currentLevelMeters, level_cm: currentLevelCm, status: statusText };

        let comp = "Stable vs yesterday";
        if (histRes.ok) {
          const histData = await histRes.json();
          const arr = histData?.measurements ?? histData;
          if (Array.isArray(arr) && arr.length > 0) {
            const yesterdayLevelMeters = Number(arr[0].value ?? arr[0].level ?? 0) / 100;
            const diff = currentLevelMeters - yesterdayLevelMeters;
            comp = diff === 0 ? "Same level as yesterday" : `${Math.abs(diff).toFixed(2)} m ${diff > 0 ? "higher" : "lower"} than yesterday`;
          }
        }

        setElbe({
          level: currentLevelMeters,
          level_cm: currentLevelCm,
          status: statusText,
          desc: descText,
          comparison: comp
        });
      }
    } catch (err) {
      console.error("Elbe hydrology telemetry sync failed:", err);
    }

    // 5. Compute Pulse Index & log feed from all live data
    computePulseIndex(latestAqi, latestWeather, latestTransit, histAqi, histTransit, latestElbe);
  }


  // Compute Pulse Index & dynamic log feed from live state after sync
  function computePulseIndex(
    currentAqi: AirQualityData,
    currentWeather: WeatherData,
    currentTransit: TransitData,
    histAqi: AirQualityData | null,
    histTransit: TransitData | null,
    currentElbe: { level: number; status: string },
  ) {
    // AQI component: lower AQI = higher score (inverted, clamped 0-100)
    const aqiComponent = Math.max(0, Math.min(100, 100 - currentAqi.aqi));

    // Weather comfort score
    const temp = currentWeather.temperature;
    const wind = currentWeather.windSpeed;
    const weatherComponent =
      (temp >= 14 && temp <= 24 && wind <= 25) ? 90 :
      (temp >= 10 && temp <= 30 && wind <= 40) ? 72 : 55;

    // Transit component
    const totalLines = currentTransit.delays.length;
    const delayCount = currentTransit.delays.filter(d => d.delay !== "0 min").length;
    const onTimeLines = totalLines - delayCount;
    const transitScoreRaw = totalLines > 0 ? Math.round((onTimeLines / totalLines) * 100) : 90;
    const disruptionScore = delayCount === 0 ? 100 : delayCount <= 2 ? 80 : delayCount <= 5 ? 60 : 35;
    const transitComponent = Math.round(0.6 * transitScoreRaw + 0.4 * disruptionScore);

    const newScore = Math.round(0.40 * aqiComponent + 0.35 * transitComponent + 0.25 * weatherComponent);

    // Compute previous day score for deltas
    let prevAqiComponent = aqiComponent;
    let prevTransitComponent = transitComponent;
    if (histAqi) prevAqiComponent = Math.max(0, Math.min(100, 100 - histAqi.aqi));
    if (histTransit) {
      const hTotal = histTransit.delays.length;
      const hDelay = histTransit.delays.filter(d => d.delay !== "0 min").length;
      const hOnTime = hTotal - hDelay;
      const hTransit = hTotal > 0 ? Math.round((hOnTime / hTotal) * 100) : 90;
      const hDisruption = hDelay === 0 ? 100 : hDelay <= 2 ? 80 : hDelay <= 5 ? 60 : 35;
      prevTransitComponent = Math.round(0.6 * hTransit + 0.4 * hDisruption);
    }
    const prevScore = Math.round(0.40 * prevAqiComponent + 0.35 * prevTransitComponent + 0.25 * weatherComponent);

    const airDelta = Math.round(aqiComponent - prevAqiComponent);
    const mobilityDelta = Math.round(transitComponent - prevTransitComponent);
    const trafficDelta = delayCount - (histTransit ? histTransit.delays.filter(d => d.delay !== "0 min").length : delayCount);

    setPulseIndex({ score: newScore, prevScore, airDelta, mobilityDelta, trafficDelta });

    // Build dynamic log feed
    const logs: typeof pulseLogs = [];

    // AQI log entry
    if (airDelta < 0) {
      logs.push({
        icon: "leaf",
        title: "Air quality improved",
        tag: "ECOLOGY",
        tagColor: "text-emerald-700 bg-emerald-50",
        desc: `PM2.5 decreased — air is ${Math.abs(airDelta)} AQI pts better than yesterday across city sensors.`,
      });
    } else if (airDelta > 0) {
      logs.push({
        icon: "warning",
        title: "Air quality slightly worse",
        tag: "ECOLOGY",
        tagColor: "text-orange-700 bg-orange-50",
        desc: `AQI is ${airDelta} pts higher than yesterday. Current reading: ${currentAqi.aqi} (${currentAqi.status}).`,
      });
    } else {
      logs.push({
        icon: "leaf",
        title: "Air quality stable",
        tag: "ECOLOGY",
        tagColor: "text-emerald-700 bg-emerald-50",
        desc: `AQI is ${currentAqi.aqi} today (${currentAqi.status}) — stable vs yesterday.`,
      });
    }

    // Transit log entry
    const worstDelay = currentTransit.delays
      .filter(d => d.delay !== "0 min")
      .sort((a, b) => parseInt(b.delay) - parseInt(a.delay))[0];
    if (worstDelay) {
      logs.push({
        icon: "bus",
        title: `Delays on ${worstDelay.line}`,
        tag: "MOBILITY",
        tagColor: "text-orange-700 bg-orange-50",
        desc: `${worstDelay.line} is running ${worstDelay.delay} late. ${delayCount} line${delayCount > 1 ? 's' : ''} affected across the MVB network.`,
      });
    } else {
      logs.push({
        icon: "bus",
        title: "All MVB lines on schedule",
        tag: "MOBILITY",
        tagColor: "text-emerald-700 bg-emerald-50",
        desc: "No delays reported across trams and buses right now.",
      });
    }

    // Elbe log entry
    logs.push({
      icon: "wave",
      title: currentElbe.status === "Flood Warning" ? "Elbe flood warning active" : currentElbe.status === "Low Water" ? "Elbe at low water" : "Elbe level stable",
      tag: "HYDROLOGY",
      tagColor: currentElbe.status === "Flood Warning" ? "text-rose-700 bg-rose-50" : "text-blue-700 bg-blue-50",
      desc: `River gauge at ${currentElbe.level.toFixed(2)} m — ${currentElbe.status === "Normal" ? "well below flood warning level (4.50 m). Status remains safe." : currentElbe.status}.`,
    });

    setPulseLogs(logs);
  }
  // Background fetch logic (loads real API details to keep dashboard live)
  useEffect(() => {
    performTelemetrySync();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastUpdatedText("Updating...");
    await performTelemetrySync();
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdatedText("Updated just now");
    }, 750);
  };

  // Handle sending chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, I had trouble connecting to the assistant server." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Map pin data list
  const mapPins = [
    {
      id: "pin-weather-east",
      type: "airQuality",
      title: "Weather Station East",
      description: "Atmospheric telemetry node recording temperature, humidity and air velocity.",
      metricLabel: "Temperature",
      metricValue: `${weather.temperature}°C`,
      status: "Active",
      statusColor: "text-blue-500",
      top: "32%",
      right: "22%",
      color: "bg-sky-500"
    },
    {
      id: "pin-river-strombruecke",
      type: "floodRisk",
      title: "Elbe River Gauge Node",
      description: "Hydrological ultrasonic sensor tracking water levels relative to standard levels.",
      metricLabel: "Level",
      metricValue: `${elbe.level} m`,
      status: "Normal",
      statusColor: "text-blue-500",
      top: "21%",
      right: "35%",
      color: "bg-blue-600"
    },
    {
      id: "pin-delay-b1",
      type: "traffic",
      title: "B1 Traffic Telemetry",
      description: "Roadside sensor monitoring vehicle speeds and congestion markers.",
      metricLabel: "Speed",
      metricValue: "42 km/h",
      status: "Minor Delay",
      statusColor: "text-amber-500",
      top: "52%",
      right: "26%",
      color: "bg-orange-500"
    },
    {
      id: "pin-aqi-mitte",
      type: "airQuality",
      title: "AQI Station - Stadtfeld",
      description: "Ecology station monitoring atmospheric particulates (PM2.5, PM10) and ozone levels.",
      metricLabel: "Air Quality",
      metricValue: `${aqi.aqi} Good`,
      status: "Optimal",
      statusColor: "text-emerald-500",
      top: "75%",
      left: "55%",
      color: "bg-emerald-500"
    },
    {
      id: "pin-school-dom",
      type: "schools",
      title: "Domgymnasium Magdeburg",
      description: "Public educational facility integrated with smart-city environmental feedback programs.",
      metricLabel: "Students",
      metricValue: "840 active",
      status: "Eco-certified",
      statusColor: "text-emerald-600",
      top: "60%",
      left: "45%",
      color: "bg-indigo-500"
    },
    {
      id: "pin-park-rotehorn",
      type: "greenAreas",
      title: "Rotehornpark Canopy Node",
      description: "Urban forestry sensor monitoring soil moisture and carbon capture volume.",
      metricLabel: "CO2 Absorption",
      metricValue: "4.2 t/year",
      status: "Optimal",
      statusColor: "text-emerald-500",
      top: "82%",
      right: "42%",
      color: "bg-green-600"
    },
    {
      id: "pin-transit-hbf",
      type: "publicTransport",
      title: "Magdeburg Hauptbahnhof Hub",
      description: "Central railway station tracking real-time departures and transit delays.",
      metricLabel: "Active Trams",
      metricValue: "8 lines",
      status: "Operational",
      statusColor: "text-emerald-500",
      top: "40%",
      left: "35%",
      color: "bg-red-500"
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans antialiased text-[#0f172a] select-none flex flex-col w-full">
      
      {/* Top Header Area */}
      <header className="w-full border-b border-zinc-150 px-6 lg:px-12 py-5.5 bg-white flex flex-col md:flex-row justify-between items-center gap-6 relative z-45 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3.5">
          {/* Crest Castle Logo */}
          <div className="w-10.5 h-10.5 bg-[#0c6b5b] rounded-xl flex items-center justify-center text-white shadow-xs">
            <svg className="w-6.5 h-6.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-[19px] font-black text-[#0a2540] tracking-tight">Magdeburg Pulse</span>
            <span className="text-[13px] font-semibold text-zinc-400 border-l border-zinc-200 pl-3 tracking-wide hidden sm:inline">Smart city. Shared future.</span>
          </div>
        </div>
        
        {/* Navigation Menus */}
        <nav className="flex flex-wrap items-center gap-7 sm:gap-9 text-[15.5px] font-black text-zinc-400">
          {[
            { id: "city-pulse", label: "Home" },
            { id: "mobility", label: "Mobility" },
            { id: "environment", label: "Environment" },
            { id: "housing", label: "Housing & Affordability" },
            { id: "map", label: "Map" },
            { id: "about", label: "About" }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`pb-1 cursor-pointer transition-all ${
                activeTab === tab.id 
                  ? "text-[#0c6b5b] border-b-2 border-[#0c6b5b] font-black" 
                  : "hover:text-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2.5 bg-[#eefcf7] border border-green-200/80 rounded-lg px-3 py-1.5">
            <LeafIcon className="w-4 h-4 text-[#0c6b5b] fill-emerald-100/10" />
            <span className="text-[10px] font-black text-[#0c6b5b] uppercase tracking-wider">EU Green Cities</span>
          </div>
          <button className="flex items-center gap-2 text-[13px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200/80 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-all cursor-pointer">
            <span>EN</span>
            <GlobeIcon className="text-zinc-400 w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="w-full max-w-[1450px] mx-auto flex-1 flex flex-col p-6 lg:p-10 gap-8">
        
        {/* TAB 1: City Pulse (Landing View) */}
        {activeTab === "city-pulse" && (
          <div className="space-y-8 animate-fadeIn text-left">
            
            {/* Unified Hero Gradient Banner with integrated score */}
            <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#052e26] via-[#0c6b5b] to-[#114e44] text-white p-7 lg:p-10 shadow-lg shadow-teal-950/10 border border-emerald-900/30 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
              {/* Blur accent glow */}
              <div className="absolute top-[-50px] right-[-50px] w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-[-100px] left-[10%] w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="space-y-3.5 relative z-10 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#3cf6cc] bg-[#3cf6cc]/10 border border-[#3cf6cc]/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3cf6cc] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3cf6cc]"></span>
                    </span>
                    Live Dashboard
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-200/80 font-bold text-xs bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 backdrop-blur-xs">
                    <span>{lastUpdatedText}</span>
                    <button 
                      onClick={handleRefresh}
                      className="hover:text-white transition-colors focus:outline-none cursor-pointer"
                      disabled={isRefreshing}
                    >
                      <RefreshIcon className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#3cf6cc]" : ""}`} />
                    </button>
                  </div>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight text-white">
                  The Pulse of Magdeburg
                </h2>
                <p className="text-emerald-100/80 text-xs sm:text-[13.5px] font-medium leading-relaxed">
                  Welcome to Magdeburg's modern civic telemetry dashboard. Monitor real-time air quality index scores, public transit delays, Elbe River levels, and environmental micro-logs to stay aligned with the city's pulse.
                </p>
              </div>

              {/* Glowing glassmorphic score widget */}
              <div className="relative z-10 w-full lg:w-auto flex-shrink-0 flex items-center justify-between lg:justify-start gap-5 bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl shadow-xl shadow-teal-950/20">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Pulse Index</span>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="text-4xl font-black text-white tracking-tighter">{pulseIndex.score}<span className="text-emerald-300 text-sm">/100</span></span>
                    {pulseIndex.score !== pulseIndex.prevScore && (
                      <span className={`text-xs font-black flex items-center gap-0.5 px-2 py-0.5 rounded border ${
                        pulseIndex.score > pulseIndex.prevScore
                          ? "text-[#3cf6cc] bg-emerald-500/10 border-emerald-500/20"
                          : "text-rose-300 bg-rose-500/10 border-rose-500/20"
                      }`}>
                        {pulseIndex.score > pulseIndex.prevScore ? "↑" : "↓"} {Math.abs(pulseIndex.score - pulseIndex.prevScore)} pts
                      </span>
                    )}
                  </div>
                </div>
                <div className="border-l border-white/10 pl-5 space-y-1 text-[11px] text-emerald-100/90 font-medium">
                  <div className="flex justify-between gap-4">
                    <span className="text-emerald-200/80 font-semibold">Air Quality:</span>
                    <span className={`font-black ${pulseIndex.airDelta >= 0 ? "text-[#3cf6cc]" : "text-rose-400"}`}>
                      {pulseIndex.airDelta > 0 ? "+" : ""}{pulseIndex.airDelta}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-emerald-200/80 font-semibold">Mobility:</span>
                    <span className={`font-black ${pulseIndex.mobilityDelta >= 0 ? "text-[#3cf6cc]" : "text-rose-400"}`}>
                      {pulseIndex.mobilityDelta > 0 ? "+" : ""}{pulseIndex.mobilityDelta}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-emerald-200/80 font-semibold">Traffic delays:</span>
                    <span className={`font-black ${pulseIndex.trafficDelta <= 0 ? "text-[#3cf6cc]" : "text-rose-400"}`}>
                      {pulseIndex.trafficDelta > 0 ? "+" : ""}{pulseIndex.trafficDelta}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Cards Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              
              {/* CARD 1: Weather — clickable → Environment tab */}
              <div
                className="bg-gradient-to-br from-white via-white to-amber-50/15 border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 hover:border-amber-400/20 transition-all duration-300 min-h-[220px] cursor-pointer"
                onClick={() => setActiveTab("environment")}
                title="View Environment screen"
              >
                <div className="flex justify-between items-center text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                  <span>Weather now</span>
                  <span className="text-amber-500 text-[11px]">⛅</span>
                </div>
                
                <div className="my-3.5 flex items-center gap-3">
                  <PartlyCloudyIcon />
                  <div className="text-left">
                    <div className="text-3xl font-black text-zinc-955 tracking-tighter leading-none">{weather.temperature}°C</div>
                    <div className="text-[12px] font-black text-zinc-500 mt-1">{weather.condition}</div>
                  </div>
                </div>
                
                <div className="text-left">
                  <div className="text-[11px] font-bold text-zinc-400">Feels like {weather.temperature - 1}°C • Wind {weather.windSpeed} km/h</div>
                  <div className="mt-3 border-t border-zinc-100 pt-3 flex items-center gap-1.5 text-[11px] font-extrabold text-[#2563eb]">
                    <ArrowUpRight className="text-blue-500 w-3.5 h-3.5" />
                    <span>{weather.comparison ?? 'Slightly better than yesterday'}</span>
                  </div>
                </div>
              </div>

              {/* CARD 2: Air Quality — clickable → Environment tab */}
              <div
                className="bg-gradient-to-br from-white via-white to-emerald-50/15 border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 hover:border-emerald-500/20 transition-all duration-300 min-h-[220px] text-center items-center cursor-pointer"
                onClick={() => setActiveTab("environment")}
                title="View Environment screen"
              >
                <div className="flex justify-between items-center text-[10px] font-black text-zinc-400 uppercase tracking-wider w-full text-left">
                  <span>Air quality</span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                
                <div className="my-1 flex justify-center">
                  <div className="relative flex items-center justify-center w-20 h-20">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <path
                        d="M 20 80 A 35 35 0 1 1 80 80"
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="8.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 20 80 A 35 35 0 1 1 80 80"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="8.5"
                        strokeLinecap="round"
                        strokeDasharray="165"
                        strokeDashoffset={165 - (165 * aqi.aqi) / 100}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center -mt-1">
                      <span className="text-2xl font-black text-zinc-955 tracking-tighter leading-none">{aqi.aqi}</span>
                      <span className="text-[9.5px] font-black text-[#10b981] mt-0.5 uppercase tracking-wide">{aqi.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-full text-left">
                  <div className="text-[11px] text-zinc-500 font-semibold leading-tight line-clamp-2">Atmospheric pollutants are within standard limits.</div>
                  <div className="mt-3 border-t border-zinc-100 pt-3 flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-[#10b981] w-full">
                    <ArrowDownRight className="text-[#10b981] w-3.5 h-3.5" />
                    <span>{aqi.comparison ?? "Slightly better than yesterday"}</span>
                  </div>
                </div>
              </div>

              {/* CARD 3: Mobility Status — clickable → Mobility tab */}
              <div
                className="bg-gradient-to-br from-white via-white to-emerald-50/15 border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 hover:border-emerald-500/20 transition-all duration-300 min-h-[220px] text-center items-center cursor-pointer"
                onClick={() => setActiveTab("mobility")}
                title="View Mobility screen"
              >
                <div className="flex justify-between items-center text-[10px] font-black text-zinc-400 uppercase tracking-wider w-full text-left">
                  <span>Mobility status</span>
                  <span className="text-[#10b981] text-[11px]">✓</span>
                </div>
                
                <div className="my-2.5 flex flex-col items-center gap-1">
                  <BusIcon />
                  <div className="text-[13px] font-black text-[#0c6b5b] uppercase tracking-wider mt-1">{mobilityStatus.status}</div>
                </div>
                
                <div className="w-full text-left">
                  <div className="text-[11px] text-zinc-500 font-semibold leading-tight line-clamp-2">{mobilityStatus.desc}</div>
                  <div className="mt-3 border-t border-zinc-100 pt-3 flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-[#10b981] w-full">
                    <ArrowDownRight className="text-[#10b981] w-3.5 h-3.5" />
                    <span>{mobilityStatus.comparison}</span>
                  </div>
                </div>
              </div>

              {/* CARD 4: Traffic Disruptions */}
              <div
                className="bg-gradient-to-br from-white via-white to-rose-50/15 border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 hover:border-orange-500/20 transition-all duration-300 min-h-[220px] text-center items-center cursor-pointer"
                onClick={() => setActiveTab("mobility")}
                title="View Mobility screen"
              >
                <div className="flex justify-between items-center text-[10px] font-black text-zinc-400 uppercase tracking-wider w-full text-left">
                  <span>Traffic alerts</span>
                  <span className="text-orange-500 text-[11px]">⚠</span>
                </div>
                
                <div className="my-1.5 flex flex-col items-center gap-0.5">
                  <WarningIcon />
                  <div className="text-2xl font-black text-orange-500 leading-none mt-0.5">{traffic.activeCount}</div>
                  <div className="text-[9px] font-black text-[#c2410c] uppercase tracking-wider bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md mt-1">Delays Active</div>
                </div>
                
                <div className="w-full text-left">
                  <div className="text-[11px] text-zinc-500 font-semibold leading-tight line-clamp-2">{traffic.desc}</div>
                  <div className="mt-3 border-t border-zinc-100 pt-3 flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-orange-500 w-full">
                    <ArrowUpRight className="text-orange-500 w-3.5 h-3.5" />
                    <span>{traffic.comparison}</span>
                  </div>
                </div>
              </div>

              {/* CARD 5: Elbe Level */}
              <div
                className="bg-gradient-to-br from-white via-white to-blue-50/15 border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 hover:border-blue-500/20 transition-all duration-300 min-h-[220px] text-center items-center cursor-pointer"
                onClick={() => setActiveTab("environment")}
                title="View Environment screen"
              >
                <div className="flex justify-between items-center text-[10px] font-black text-zinc-400 uppercase tracking-wider w-full text-left">
                  <span>Elbe hydrology</span>
                  <span className="text-blue-500 text-[11px]">🌊</span>
                </div>
                
                <div className="my-3 flex flex-col items-center gap-1">
                  <WaveIcon />
                  <div className="text-center">
                    <div className="text-2xl font-black text-zinc-955 tracking-tighter leading-none mt-1">
                      {elbe.level.toFixed(2)} m {elbe.level_cm ? `(${elbe.level_cm} cm)` : ""}
                    </div>
                    <div className="text-[9.5px] font-black text-[#2563eb] mt-0.5 uppercase tracking-wider bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-md inline-block">{elbe.status}</div>
                  </div>
                </div>
                
                <div className="w-full text-left">
                  <div className="text-[11px] text-zinc-500 font-semibold leading-tight line-clamp-2">{elbe.desc}</div>
                  <div className="mt-3 border-t border-zinc-100 pt-3 flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-[#2563eb] w-full">
                    <ArrowUpRight className="text-blue-500 w-3.5 h-3.5" />
                    <span>{elbe.comparison}</span>
                  </div>
                </div>
              </div>

            </section>

            {/* Bottom Split Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Left Column: What changed today */}
              <div className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between text-left">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <h3 className="text-base font-black text-zinc-955 flex items-center gap-2">
                      📰 City Pulse Log Feed
                    </h3>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Communal alerts</span>
                  </div>
                  
                  <div className="space-y-4">
                    {pulseLogs.length > 0 ? pulseLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-4 items-start bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 transition-colors">
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${
                          log.icon === "leaf" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          log.icon === "bus"  ? "bg-orange-50 text-orange-600 border-orange-100" :
                          log.icon === "wave" ? "bg-blue-50 text-blue-600 border-blue-100" :
                          "bg-orange-50 text-orange-600 border-orange-100"
                        }`}>
                          {log.icon === "leaf" && <LeafIcon className="w-4 h-4 fill-emerald-100/10" />}
                          {log.icon === "bus" && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                              <rect x="3" y="6" width="18" height="11" rx="2" />
                              <path d="M5 17v2a1 1 0 001 1h1a1 1 0 001-1v-2M16 17v2a1 1 0 001 1h1a1 1 0 001-1v-2" />
                              <path d="M3 10h18" />
                            </svg>
                          )}
                          {log.icon === "wave" && <WaveIcon />}
                          {log.icon === "warning" && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V8h2v4z" />
                            </svg>
                          )}
                        </div>
                        <div className="text-[13px] leading-snug">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-zinc-800">{log.title}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${log.tagColor}`}>{log.tag}</span>
                          </div>
                          <p className="text-zinc-500 mt-1 font-semibold text-xs leading-normal">{log.desc}</p>
                        </div>
                      </div>
                    )) : (
                      // Skeleton placeholders while data loads
                      [0,1,2].map(i => (
                        <div key={i} className="flex gap-4 items-start bg-zinc-50/50 border border-zinc-100 rounded-xl p-3.5">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 flex-shrink-0 animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-zinc-100 rounded w-1/3 animate-pulse" />
                            <div className="h-2.5 bg-zinc-100 rounded w-2/3 animate-pulse" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Mini Map Component */}
              <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4 text-left">
                  <h3 className="text-base font-black text-zinc-955">
                    🗺️ Interactive IoT Pins
                  </h3>
                  <button 
                    onClick={() => setActiveTab("map")}
                    className="text-[11px] font-black text-[#0c6b5b] hover:text-[#095246] transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    Open Map ➜
                  </button>
                </div>

                <div className="relative w-full h-[210px] rounded-2xl overflow-hidden border border-zinc-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] bg-zinc-50">
                  <img
                    src="/magdeburg-map.png"
                    alt="Magdeburg Minimalist Map"
                    className="w-full h-full object-cover object-center opacity-95"
                  />
                  
                  {/* Overlay Center Label */}
                  <div className="absolute top-[48%] left-[32%] -translate-x-1/2 -translate-y-1/2 bg-white/95 px-3 py-1.5 rounded-lg shadow-sm border border-zinc-200/80 text-[11px] font-extrabold text-[#0a2540] tracking-tight">
                    Magdeburg
                  </div>

                  {/* Pins overlay */}
                  <div className="absolute top-[32%] right-[22%] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer group">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600 border-2 border-white shadow-md"></span>
                    </span>
                  </div>

                  <div className="absolute top-[21%] right-[35%] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer group">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600 border-2 border-white shadow-md"></span>
                    </span>
                  </div>

                  <div className="absolute top-[52%] right-[26%] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer group">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#10b981] border-2 border-white shadow-md"></span>
                    </span>
                  </div>

                  <div className="absolute top-[75%] left-[55%] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer group">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#10b981] border-2 border-white shadow-md"></span>
                    </span>
                  </div>
                </div>
              </div>

            </section>

          </div>
        )}

        {/* TAB 2: Mobility View */}
        {activeTab === "mobility" && (
          <MobilityScreen />
        )}

        {/* TAB 3: Environment View */}
        {activeTab === "environment" && (
          <EnvironmentScreen />
        )}

        {/* TAB 4: Housing & Affordability View */}
        {activeTab === "housing" && (
          <div className="space-y-8 animate-fadeIn text-left">
            <div>
              <h2 className="text-[26px] font-black tracking-tight text-[#0a2540]">
                Housing & Rental Affordability
              </h2>
              <p className="text-sm text-zinc-500 font-semibold mt-1">Localized rental indices, affordability thresholds, social housing construction progress, and building efficiency classes.</p>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4.5 shadow-xs">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Median Rent Price</span>
                <div className="text-2xl font-black text-[#0c6b5b] mt-1">€8.55 / m² <span className="text-xs font-bold text-emerald-500">(Stable)</span></div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-1 block">Magdeburg municipal average index</span>
              </div>
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4.5 shadow-xs">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Affordability Ratio</span>
                <div className="text-2xl font-black text-zinc-800 mt-1">27.4% <span className="text-xs font-bold text-emerald-500">(Optimal)</span></div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-1 block">Median rent-to-income index (Target: &lt;30%)</span>
              </div>
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4.5 shadow-xs">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Social Housing Units</span>
                <div className="text-2xl font-black text-zinc-800 mt-1">1,250 <span className="text-xs font-bold text-zinc-450">Units</span></div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-1 block">Active development projects underway</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              <div className="lg:col-span-12">
                <RentByDistrict />
              </div>

            </div>

          </div>
        )}

        {/* TAB 5: Full Screen Interactive Map View */}
        {activeTab === "map" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-fadeIn">
            
            {/* Sidebar Filters */}
            <div className="lg:col-span-4 space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-[#0a2540]">
                  Interactive Sensors Map
                </h2>
                <p className="text-[13px] text-zinc-500 font-semibold mt-1">Toggle filter categories and tap any node to inspect real-time metrics.</p>
              </div>

              {/* Filters Checklist */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-3 shadow-xs">
                <h3 className="text-sm font-black text-zinc-800 uppercase tracking-wider mb-2">Sensor Layers</h3>
                
                <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-zinc-700 hover:text-zinc-900">
                  <input 
                    type="checkbox" 
                    checked={mapFilters.publicTransport} 
                    onChange={() => setMapFilters({...mapFilters, publicTransport: !mapFilters.publicTransport})}
                    className="w-4.5 h-4.5 rounded text-[#0c6b5b] focus:ring-[#0c6b5b] cursor-pointer"
                  />
                  <span>🚌 Transit Hubs & Trams</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-zinc-700 hover:text-zinc-900">
                  <input 
                    type="checkbox" 
                    checked={mapFilters.airQuality} 
                    onChange={() => setMapFilters({...mapFilters, airQuality: !mapFilters.airQuality})}
                    className="w-4.5 h-4.5 rounded text-[#0c6b5b] focus:ring-[#0c6b5b] cursor-pointer"
                  />
                  <span>🍃 Air Quality Sensors</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-zinc-700 hover:text-zinc-900">
                  <input 
                    type="checkbox" 
                    checked={mapFilters.floodRisk} 
                    onChange={() => setMapFilters({...mapFilters, floodRisk: !mapFilters.floodRisk})}
                    className="w-4.5 h-4.5 rounded text-[#0c6b5b] focus:ring-[#0c6b5b] cursor-pointer"
                  />
                  <span>🌊 Elbe River Water Gauges</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-zinc-700 hover:text-zinc-900">
                  <input 
                    type="checkbox" 
                    checked={mapFilters.traffic} 
                    onChange={() => setMapFilters({...mapFilters, traffic: !mapFilters.traffic})}
                    className="w-4.5 h-4.5 rounded text-[#0c6b5b] focus:ring-[#0c6b5b] cursor-pointer"
                  />
                  <span>🚗 Traffic Telemetry</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-zinc-700 hover:text-zinc-900">
                  <input 
                    type="checkbox" 
                    checked={mapFilters.schools} 
                    onChange={() => setMapFilters({...mapFilters, schools: !mapFilters.schools})}
                    className="w-4.5 h-4.5 rounded text-[#0c6b5b] focus:ring-[#0c6b5b] cursor-pointer"
                  />
                  <span>🏫 Smart Schools & Edu</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-zinc-700 hover:text-zinc-900">
                  <input 
                    type="checkbox" 
                    checked={mapFilters.greenAreas} 
                    onChange={() => setMapFilters({...mapFilters, greenAreas: !mapFilters.greenAreas})}
                    className="w-4.5 h-4.5 rounded text-[#0c6b5b] focus:ring-[#0c6b5b] cursor-pointer"
                  />
                  <span>🌳 Canopy & Park Nodes</span>
                </label>
              </div>

              {/* Click Detail Card */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
                {selectedMapPin ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[15px] font-black text-[#0a2540]">{selectedMapPin.title}</span>
                      <span className={`text-[11px] font-extrabold ${selectedMapPin.statusColor}`}>{selectedMapPin.status}</span>
                    </div>
                    <p className="text-[12.5px] text-zinc-500 font-semibold leading-relaxed">{selectedMapPin.description}</p>
                    
                    <div className="border-t border-zinc-200/80 pt-3 flex justify-between items-baseline">
                      <span className="text-xs text-zinc-400 font-bold uppercase">{selectedMapPin.metricLabel}</span>
                      <span className="text-lg font-black text-zinc-800">{selectedMapPin.metricValue}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-400 text-sm font-bold">
                    💡 Click on any active pin on the map to show detail telemetry popups.
                  </div>
                )}
              </div>

            </div>

            {/* Large Map Panel */}
            <div className="lg:col-span-8">
              <div className="relative w-full h-[450px] rounded-3xl overflow-hidden border border-zinc-200/95 shadow-sm bg-zinc-50">
                <img
                  src="/magdeburg-map.png"
                  alt="Magdeburg Big Map"
                  className="w-full h-full object-cover"
                />

                {/* Magdeburg Label */}
                <div className="absolute top-[48%] left-[32%] -translate-x-1/2 -translate-y-1/2 bg-white/95 px-4 py-2 rounded-xl shadow-md border border-zinc-200 text-xs font-black text-[#0a2540] tracking-wider uppercase">
                  Magdeburg
                </div>

                {/* Render Pins based on filters */}
                {mapPins
                  .filter(pin => mapFilters[pin.type as keyof typeof mapFilters])
                  .map(pin => (
                    <button
                      key={pin.id}
                      onClick={() => setSelectedMapPin(pin)}
                      style={{
                        top: pin.top,
                        right: pin.right,
                        left: pin.left
                      }}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-125 focus:outline-none ${pin.color} text-white`}
                    >
                      <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
                    </button>
                  ))}

              </div>
            </div>

          </div>
        )}

        {/* TAB 6: Editorial About View */}
        {activeTab === "about" && (
          <div className="max-w-4xl mx-auto space-y-6 text-left animate-fadeIn py-2 flex flex-col md:flex-row gap-8 items-start">
            
            <div className="flex-1 space-y-6">
              <h2 className="text-2xl font-black text-[#0a2540]">About Magdeburg Pulse</h2>
              
              <div className="text-[14px] text-zinc-600 leading-relaxed font-semibold space-y-4">
                <p>
                  Magdeburg Pulse is an experimental, open-source civic data dashboard built for hackers, developers, and municipal officials. It showcases how localized IoT data streams (river hydrology, road micro-sensors, open transit telemetry) can be integrated into a unified index for decision makers.
                </p>
              </div>

              <div className="border border-zinc-150 rounded-2xl p-5 bg-white space-y-3 shadow-xs">
                <h3 className="text-sm font-black text-zinc-800 uppercase tracking-wider">🛠️ Technology Stack & Reusability</h3>
                <div className="text-[12px] text-zinc-500 font-semibold leading-relaxed space-y-2">
                  <p>
                    <strong>Modern Architecture:</strong> Developed using React, Next.js, and styled using Tailwind CSS v4 for utility-first layout responsiveness. The platform uses fully containerized REST APIs configured to handle server-side cache invalidations automatically.
                  </p>
                  <p>
                    <strong>Reusability & Extensibility:</strong> The modular components are designed to easily plug in other city feeds. Any city running open-standard GTFS transit feeds, open weather REST endpoints, or Pegelonline hydrology logs can adopt this dashboard simply by updating the backend configuration.
                  </p>
                </div>
              </div>

              <div className="border border-zinc-150 rounded-2xl p-5 bg-white space-y-3 shadow-xs">
                <h3 className="text-sm font-black text-zinc-800 uppercase tracking-wider">🔓 Open API Documentation & Data Sources</h3>
                <div className="text-[12px] text-zinc-500 font-semibold leading-relaxed space-y-2">
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Weather Telemetry:</strong> Integrates local meteorological forecasts from the German Weather Service (DWD) API.</li>
                    <li><strong>Air Quality Index:</strong> Pulls PM2.5 and PM10 metrics from the European Environment Agency (EEA) API.</li>
                    <li><strong>Transit & Delays:</strong> Consumes real-time updates from MVB's open GTFS-RT feed.</li>
                    <li><strong>River Hydrology:</strong> Connects to Pegelonline API for live Elbe gauge statistics.</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="border border-zinc-150 rounded-2xl p-4.5 bg-zinc-50">
                  <h3 className="text-xs font-black text-zinc-800 uppercase tracking-wider mb-2">🌿 EU Green Cities Pact</h3>
                  <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
                    Magdeburg aims to reduce carbon emissions by transitioning fleets, optimizing routes, and expanding parks. The Pulse index keeps the city accountable.
                  </p>
                </div>

                <div className="border border-zinc-150 rounded-2xl p-4.5 bg-zinc-50">
                  <h3 className="text-xs font-black text-zinc-800 uppercase tracking-wider mb-2">🚀 Future Project Roadmap</h3>
                  <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
                    Upcoming features include predictive AI modeling for traffic congestions, citizen-led street complaint reports, and integration of solar yield sensors.
                  </p>
                </div>
              </div>
            </div>

            {/* Cathedral Image */}
            <div className="w-full md:w-64 flex-shrink-0 bg-zinc-50 border border-zinc-200/80 rounded-3xl p-4 shadow-xs space-y-3">
              <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-zinc-100 border border-zinc-200/60 shadow-inner">
                <img
                  src="/magdeburg-cathedral.png"
                  alt="Magdeburg Cathedral watercolor"
                  className="w-full h-full object-cover object-bottom"
                />
              </div>
              <div className="text-[12px] font-extrabold text-zinc-500 text-center leading-normal">
                The Magdeburger Dom sitting on the Elbe River banks.
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FLOATING CHATBOT WIDGET: Re-positioned to Bottom-right pop-up */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        
        {/* Chat window panel */}
        {isChatOpen && (
          <div className="w-[340px] sm:w-[380px] h-[480px] bg-white border border-zinc-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-fadeIn transition-all duration-300 border-zinc-300/80">
            {/* Header */}
            <div className="bg-[#0c6b5b] px-4 py-3.5 flex justify-between items-center text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-7.5 h-7.5 bg-white/10 rounded-lg flex items-center justify-center">
                  <img src="/ask-otto-logo.svg" alt="Ask Otto logo" className="w-4.5 h-4.5 object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-black leading-none">Ask Otto</h4>
                  <span className="text-[9.5px] text-[#cbf3eb] font-bold mt-1 block">Smart City Assistant</span>
                </div>
              </div>
              
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-white/80 hover:text-white transition-colors focus:outline-none cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Message Queue thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50/50 scrollbar-thin">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-[#0c6b5b] text-white rounded-tr-none shadow-xs font-semibold"
                        : "bg-white text-zinc-700 rounded-tl-none border border-zinc-200/80 shadow-xs font-semibold"
                    }`}
                  >
                    {msg.sender === "bot" ? (
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(msg.text) }} />
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-zinc-200/85 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs text-zinc-400 flex items-center gap-1.5 shadow-xs font-semibold">
                    <span>Ask Otto is thinking</span>
                    <span className="flex gap-0.5">
                      <span className="h-1 w-1 rounded-full bg-zinc-400 animate-bounce"></span>
                      <span className="h-1 w-1 rounded-full bg-zinc-400 animate-bounce delay-75"></span>
                      <span className="h-1 w-1 rounded-full bg-zinc-400 animate-bounce delay-150"></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form Footer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-200/80 bg-white flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about weather, air quality, transit..."
                className="flex-1 rounded-xl bg-zinc-50 border border-zinc-200 px-3.5 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#0c6b5b] focus:ring-1 focus:ring-[#0c6b5b]"
              />
              <button
                type="submit"
                className="bg-[#0c6b5b] hover:bg-[#095246] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Floating Bubble Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-[#0c6b5b] hover:bg-[#095246] hover:scale-105 transition-all text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer focus:outline-none group relative"
        >
          {isChatOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          ) : (
            <img src="/ask-otto-logo.svg" alt="Ask Otto" className="w-6.5 h-6.5 object-contain" />
          )}

          {/* Tiny pulse indicator dot */}
          {!isChatOpen && (
            <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
            </span>
          )}
        </button>

      </div>

    </div>
  );
}
