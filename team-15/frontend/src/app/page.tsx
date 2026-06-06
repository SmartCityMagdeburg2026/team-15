"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

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

// Dynamic import of the Leaflet Map component with SSR disabled
const SensorMap = dynamic(() => import("@/components/SensorMap"), {
  ssr: false,
  loading: () => <div style={{ height: "560px" }} className="rounded-3xl bg-zinc-100 animate-pulse" />,
});

export default function Home() {
  const [activeTab, setActiveTab] = useState<"city-pulse" | "mobility" | "environment" | "housing" | "map" | "about" | "reports">("city-pulse");
  const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false);

  // 1. Weather now state
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 18,
    condition: "Partly cloudy",
    humidity: 62,
    windSpeed: 14.5,
    comparison: "Slightly warmer than yesterday"
  });

  // 2. Air quality state
  const [aqi, setAqi] = useState<AirQualityData>({
    aqi: 42,
    status: "Good",
    pm25: 9.4,
    pm10: 18.2
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
    status: "Normal",
    desc: "Below flood warning level (4.50 m).",
    comparison: "0.08 m vs yesterday"
  });

  const [lastUpdatedText, setLastUpdatedText] = useState("Updated 8 min ago");
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    type: string;
    title: string;
    description: string;
    metricLabel: string;
    metricValue: string;
    status: string;
    statusColor: string;
    metrics?: { label: string; value: string }[];
    lat?: number;
    lng?: number;
  } | null>(null);

  // Active Map Filter Layers
  const [mapFilters, setMapFilters] = useState({
    airQuality: true,
    traffic: true,
    floodRisk: true,
    schools: true,
    greenAreas: true,
    publicTransport: true,
    hospitals: true
  });

  // Pre-seed dynamic pins with Magdeburg's two major hospitals as baseline/fallback
  const [dynamicPins, setDynamicPins] = useState<any[]>([
    {
      id: "hospital-uni",
      type: "hospitals",
      title: "Universitätsklinikum Magdeburg",
      description: "Leipziger Str. 44, 39120 Magdeburg. University hospital providing maximum medical care and clinical research facilities.",
      metricLabel: "Beds Capacity",
      metricValue: "~1,200",
      status: "Emergency Ready",
      statusColor: "text-emerald-600 font-bold",
      color: "bg-rose-500",
      lat: 52.1089,
      lng: 11.6171,
      metrics: [
        { label: "Beds Capacity", value: "~1,200" },
        { label: "Emergency Room", value: "Yes (ZNA)" },
        { label: "Specialities", value: "Cardiology, Neurology" },
        { label: "Type", value: "Maximum Care" }
      ]
    },
    {
      id: "hospital-municipal",
      type: "hospitals",
      title: "Klinikum Magdeburg",
      description: "Birkenallee 34, 39130 Magdeburg. General municipal hospital catering to regional healthcare demands and acute therapies.",
      metricLabel: "Beds Capacity",
      metricValue: "~620",
      status: "Emergency Ready",
      statusColor: "text-emerald-600 font-bold",
      color: "bg-rose-500",
      lat: 52.1467,
      lng: 11.6283,
      metrics: [
        { label: "Beds Capacity", value: "~620" },
        { label: "Emergency Room", value: "Yes" },
        { label: "Specialities", value: "Orthopaedics, Surgery" },
        { label: "Type", value: "General Municipal" }
      ]
    }
  ]);

  // Load all Magdeburg hospitals from Overpass API dynamically at runtime
  useEffect(() => {
    async function fetchHospitals() {
      try {
        const query = `[out:json][timeout:25];
area[name="Magdeburg"]->.searchArea;
(
  node["amenity"="hospital"](area.searchArea);
  way["amenity"="hospital"](area.searchArea);
  relation["amenity"="hospital"](area.searchArea);
);
out center;`;
        const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Overpass API failed");
        const data = await res.json();
        
        if (!data.elements || data.elements.length === 0) return;
        
        const fetchedHospitals = data.elements.map((el: any) => {
          const id = `hospital-${el.id}`;
          const tags = el.tags || {};
          const name = tags.name || "Magdeburg Hospital";
          
          const lat = el.lat ?? el.center?.lat;
          const lng = el.lon ?? el.center?.lon;
          if (!lat || !lng) return null;
          
          const emergency = tags.emergency === "yes" ? "Yes" : tags.emergency === "no" ? "No" : "Yes (Assumed)";
          
          let beds = "~150";
          let specialities = "General Medicine";
          let type = "General Clinic";
          
          if (name.toLowerCase().includes("universität") || name.toLowerCase().includes("uni-klinik") || name.toLowerCase().includes("university")) {
            beds = "~1,200";
            specialities = "Cardiology, Neurology, Immunology";
            type = "University Hospital";
          } else if (name.toLowerCase().includes("klinikum magdeburg") || name.toLowerCase().includes("olvenstedt")) {
            beds = "~620";
            specialities = "Orthopaedics, Internal medicine, Surgery";
            type = "General Municipal Hospital";
          } else if (name.toLowerCase().includes("st. marienstift") || name.toLowerCase().includes("marienstift")) {
            beds = "~250";
            specialities = "Obstetrics, Gynaecology, Surgery";
            type = "Specialist Clinic";
          } else if (name.toLowerCase().includes("pfeiffersche") || name.toLowerCase().includes("pfeiffer")) {
            beds = "~350";
            specialities = "Orthopaedics, Geriatrics, Palliative";
            type = "General Hospital";
          }
          
          const street = tags["addr:street"] || "";
          const houseNumber = tags["addr:housenumber"] || "";
          const postcode = tags["addr:postcode"] || "";
          const city = tags["addr:city"] || "Magdeburg";
          const address = street ? `${street} ${houseNumber}, ${postcode} ${city}` : "Magdeburg, Germany";
          
          return {
            id,
            type: "hospitals",
            title: name,
            description: tags.description || `Address: ${address}. Medical healthcare facility offering specialized treatments.`,
            metricLabel: "Beds Capacity",
            metricValue: beds,
            status: emergency === "Yes" ? "Emergency Ready" : "Specialist Care",
            statusColor: emergency === "Yes" ? "text-emerald-600 font-bold" : "text-blue-500 font-semibold",
            color: "bg-rose-500",
            lat,
            lng,
            metrics: [
              { label: "Beds Capacity", value: beds },
              { label: "Emergency Room", value: emergency },
              { label: "Specialities", value: specialities.split(", ").slice(0, 2).join(", ") },
              { label: "Type", value: type.replace(" Hospital", "") }
            ]
          };
        }).filter(Boolean);

        if (fetchedHospitals.length > 0) {
          setDynamicPins(fetchedHospitals);
        }
      } catch (err) {
        console.error("Failed to load hospitals from Overpass API:", err);
      }
    }
    fetchHospitals();
  }, []);

  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [liveSyncError, setLiveSyncError] = useState(false);

  // Sync Live API data on pin selection
  useEffect(() => {
    if (!selectedMapPin) return;

    let isCancelled = false;
    const pinId = selectedMapPin.id;
    const pinType = selectedMapPin.type;

    async function syncRealTimeData() {
      setIsSyncingLive(true);
      setLiveSyncError(false);

      try {
        if (pinType === "floodRisk") {
          const STATION = "MAGDEBURG-STROMBR%C3%9CCKE";
          const res = await fetch(`https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/${STATION}/W/currentmeasurement.json`);
          if (!res.ok) throw new Error("Pegelonline API failed");
          const data = await res.json();
          if (isCancelled) return;

          const waterLevelM = (data.value / 100).toFixed(2);
          const timestamp = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          setSelectedMapPin(prev => {
            if (!prev || prev.id !== pinId) return prev;
            return {
              ...prev,
              metricValue: `${waterLevelM} m`,
              status: "Live Stream",
              statusColor: "text-blue-600 font-bold animate-pulse",
              metrics: [
                { label: "Water Level", value: `${waterLevelM} m` },
                { label: "Flow Speed", value: pinId === "pin-river-north" ? "1.2 m/s" : "1.1 m/s" },
                { label: "Status", value: "Safe" },
                { label: "Last Sync", value: timestamp }
              ]
            };
          });
        } 
        else if (pinType === "greenAreas") {
          const coordsMap: Record<string, [number, number]> = {
            "pin-park-rotehorn": [52.1190, 11.6640],
            "pin-park-nordpark": [52.1420, 11.6200],
            "pin-park-herrenkrug": [52.1280, 11.6780],
          };
          const coords = coordsMap[pinId] || [52.1205, 11.6276];
          const res = await fetch(`https://api.brightsky.dev/current_weather?lat=${coords[0]}&lon=${coords[1]}`);
          if (!res.ok) throw new Error("Bright Sky API failed");
          const data = await res.json();
          if (isCancelled) return;

          const weather = data.weather || {};
          const temp = typeof weather.temperature === "number" ? Math.round(weather.temperature) : 18;
          const condition = weather.condition ? weather.condition.replace("-", " ") : "clear";
          const rain = weather.precipitation ?? 0.0;

          setSelectedMapPin(prev => {
            if (!prev || prev.id !== pinId) return prev;
            const moisture = temp > 25 ? "35%" : temp > 15 ? "48%" : "60%";
            return {
              ...prev,
              metricValue: `${temp}°C`,
              status: "Live Weather",
              statusColor: "text-emerald-600 font-bold",
              metrics: [
                { label: "Temperature", value: `${temp}°C` },
                { label: "Condition", value: condition.charAt(0).toUpperCase() + condition.slice(1) },
                { label: "Rain Rate", value: `${rain} mm/h` },
                { label: "Soil Moisture", value: moisture }
              ]
            };
          });
        }
        else if (pinType === "airQuality") {
          const res = await fetch("https://data.sensor.community/airrohr/v1/filter/area=52.1205,11.6276,10");
          if (!res.ok) throw new Error("Sensor.Community API failed");
          const data = await res.json();
          if (isCancelled) return;

          let pm25Values: number[] = [];
          let pm10Values: number[] = [];
          data.forEach((sensor: any) => {
            sensor.sensordatavalues.forEach((val: any) => {
              if (val.value_type === "P2") pm25Values.push(parseFloat(val.value));
              if (val.value_type === "P1") pm10Values.push(parseFloat(val.value));
            });
          });

          const avgPM25 = pm25Values.length > 0 ? (pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length).toFixed(1) : "9.4";
          const avgPM10 = pm10Values.length > 0 ? (pm10Values.reduce((a, b) => a + b, 0) / pm10Values.length).toFixed(1) : "18.2";

          const pmVal = parseFloat(avgPM25);
          let aqiVal = 42;
          let aqiStatus = "Good";
          let aqiColor = "text-emerald-500";
          if (pmVal <= 12.0) {
            aqiVal = Math.round((50 / 12.0) * pmVal);
          } else if (pmVal <= 35.4) {
            aqiVal = Math.round(50 + ((100 - 50) / (35.4 - 12.0)) * (pmVal - 12.0));
            aqiStatus = "Moderate";
            aqiColor = "text-amber-500";
          } else {
            aqiVal = Math.round(100 + ((150 - 100) / (55.4 - 35.4)) * (pmVal - 35.4));
            aqiStatus = "Unhealthy";
            aqiColor = "text-rose-500";
          }

          setSelectedMapPin(prev => {
            if (!prev || prev.id !== pinId) return prev;
            return {
              ...prev,
              metricValue: `${aqiVal} ${aqiStatus}`,
              status: `AQI: ${aqiStatus}`,
              statusColor: `${aqiColor} font-bold`,
              metrics: [
                { label: "AQI Score (Live)", value: `${aqiVal} ${aqiStatus}` },
                { label: "PM2.5 (Live Avg)", value: `${avgPM25} µg/m³` },
                { label: "PM10 (Live Avg)", value: `${avgPM10} µg/m³` },
                { label: "Ozone (O3)", value: "32 µg/m³" }
              ]
            };
          });
        }
      } catch (err) {
        console.error("Failed to sync live API data for pin:", pinId, err);
        if (isCancelled) return;
        setLiveSyncError(true);
      } finally {
        if (!isCancelled) {
          setIsSyncingLive(false);
        }
      }
    }

    syncRealTimeData();

    return () => {
      isCancelled = true;
    };
  }, [selectedMapPin?.id]);

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([
    { sender: "bot", text: "Hello! I am Ottobot, your Magdeburg city assistant. Ask me about weather, transit, air quality, or projects." }
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

  // Background fetch logic (loads real API details to keep dashboard live)
  useEffect(() => {
    async function loadTelemetry() {
      try {
        const [weatherRes, aqRes, transitRes] = await Promise.all([
          fetch("/api/weather"),
          fetch("/api/air-quality"),
          fetch("/api/transit")
        ]);

        if (weatherRes.ok && aqRes.ok && transitRes.ok) {
          const weatherData: WeatherData = await weatherRes.json();
          const aqData: AirQualityData = await aqRes.json();
          const transitData: TransitData = await transitRes.json();

          setWeather({
            temperature: Math.round(weatherData.temperature),
            condition: weatherData.condition,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed,
            comparison: weatherData.comparison || "Slightly warmer than yesterday"
          });

          setAqi(aqData);

          setTransitDelays(transitData.delays);

          const delayCount = transitData.delays.filter(d => d.delay !== "0 min").length;
          setTraffic({
            activeCount: delayCount,
            desc: `${delayCount} incidents causing delays.`,
            comparison: "Slightly worse than yesterday"
          });
        }
      } catch (err) {
        console.error("Telemetry background sync failed:", err);
      }
    }
    loadTelemetry();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastUpdatedText("Updating...");

    try {
      const [weatherRes, aqRes, transitRes] = await Promise.all([
        fetch("/api/weather"),
        fetch("/api/air-quality"),
        fetch("/api/transit")
      ]);

      if (weatherRes.ok && aqRes.ok && transitRes.ok) {
        const weatherData: WeatherData = await weatherRes.json();
        const aqData: AirQualityData = await aqRes.json();
        const transitData: TransitData = await transitRes.json();

        setWeather({
          temperature: Math.round(weatherData.temperature),
          condition: weatherData.condition,
          humidity: weatherData.humidity,
          windSpeed: weatherData.windSpeed,
          comparison: weatherData.comparison || "Slightly warmer than yesterday"
        });

        setAqi(aqData);

        setTransitDelays(transitData.delays);

        const delayCount = transitData.delays.filter(d => d.delay !== "0 min").length;
        setTraffic({
          activeCount: delayCount,
          desc: `${delayCount} incidents causing delays.`,
          comparison: "Slightly worse than yesterday"
        });
      }
    } catch (err) {
      console.error("Manual refresh failed:", err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setLastUpdatedText("Updated just now");
      }, 750);
    }
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
  const staticMapPins = [
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
      color: "bg-indigo-500",
      metrics: [
        { label: "Students", value: "840 active" },
        { label: "Eco-certified", value: "Level A" },
        { label: "Solar Generation", value: "24 kWp" },
        { label: "CO2 Saved", value: "12.4 t/yr" }
      ]
    },
    {
      id: "pin-school-ovgu",
      type: "schools",
      title: "OvGU Campus",
      description: "Otto-von-Guericke University campus, monitoring student activity and academic energy telemetry.",
      metricLabel: "Enrollment",
      metricValue: "13,800 students",
      status: "Active",
      statusColor: "text-emerald-500",
      top: "45%",
      left: "40%",
      color: "bg-indigo-500",
      metrics: [
        { label: "Enrollment", value: "13,800 active" },
        { label: "Campus WiFi", value: "98.8% load" },
        { label: "Research Nodes", value: "245 active" },
        { label: "Green Energy Share", value: "45%" }
      ]
    },
    {
      id: "pin-school-berufsschule",
      type: "schools",
      title: "Berufsschule Magdeburg",
      description: "Vocational training school tracking energy efficiency and workshop utilization.",
      metricLabel: "Workshops",
      metricValue: "12 active",
      status: "Operational",
      statusColor: "text-emerald-500",
      top: "40%",
      left: "30%",
      color: "bg-indigo-500",
      metrics: [
        { label: "Active Workshops", value: "12 units" },
        { label: "Lab Power Load", value: "18.5 kW" },
        { label: "Bicycle Racks", value: "82% full" },
        { label: "Energy Class", value: "B+" }
      ]
    },
    {
      id: "pin-park-rotehorn",
      type: "greenAreas",
      title: "Rotehornpark",
      description: "Urban forestry sensor monitoring soil moisture and carbon capture volume in the central island park.",
      metricLabel: "CO2 Absorption",
      metricValue: "4.2 t/year",
      status: "Optimal",
      statusColor: "text-emerald-500",
      top: "82%",
      right: "42%",
      color: "bg-green-600",
      metrics: [
        { label: "CO2 Absorption", value: "4.2 t/year" },
        { label: "Canopy Cover", value: "82%" },
        { label: "Soil Moisture", value: "48%" },
        { label: "Tree Count", value: "1,240 nodes" }
      ]
    },
    {
      id: "pin-park-nordpark",
      type: "greenAreas",
      title: "Nordpark",
      description: "Urban green area sensor tracking soil salinity, irrigation levels, and local park microclimate.",
      metricLabel: "Soil Moisture",
      metricValue: "41%",
      status: "Stable",
      statusColor: "text-emerald-500",
      top: "15%",
      left: "60%",
      color: "bg-green-600",
      metrics: [
        { label: "Soil Moisture", value: "41%" },
        { label: "Avg Temperature", value: "17.4°C" },
        { label: "Irrigation Status", value: "Idle" },
        { label: "Wildlife Activity", value: "Medium" }
      ]
    },
    {
      id: "pin-park-herrenkrug",
      type: "greenAreas",
      title: "Herrenkrugpark",
      description: "Ecology sensor monitoring historical protected woodland canopy and park hydrology.",
      metricLabel: "Tree Count",
      metricValue: "3,100 nodes",
      status: "Protected",
      statusColor: "text-emerald-500",
      top: "20%",
      right: "15%",
      color: "bg-green-600",
      metrics: [
        { label: "Protected Trees", value: "3,100 nodes" },
        { label: "Canopy Index", value: "91%" },
        { label: "Soil pH Level", value: "6.8" },
        { label: "CO2 Capture", value: "9.6 t/year" }
      ]
    },
    {
      id: "pin-delay-b1",
      type: "traffic",
      title: "B1 Traffic Sensor",
      description: "Roadside sensor monitoring vehicle speeds and congestion markers along the central B1 corridor.",
      metricLabel: "Avg Speed",
      metricValue: "42 km/h",
      status: "Minor Delay",
      statusColor: "text-amber-500",
      top: "52%",
      right: "26%",
      color: "bg-orange-500",
      metrics: [
        { label: "Speed Limit", value: "50 km/h" },
        { label: "Avg Speed", value: "42 km/h" },
        { label: "Congestion", value: "Low" },
        { label: "Incident Rate", value: "0.2/day" }
      ]
    },
    {
      id: "pin-traffic-stadtring",
      type: "traffic",
      title: "Stadtring Telemetry",
      description: "Urban express highway speed and flow tracking sensor at Sudenburg junction.",
      metricLabel: "Congestion",
      metricValue: "Low",
      status: "Optimal",
      statusColor: "text-emerald-500",
      top: "70%",
      left: "25%",
      color: "bg-orange-500",
      metrics: [
        { label: "Flow Rate", value: "1,240 veh/h" },
        { label: "Avg Speed", value: "68 km/h" },
        { label: "Congestion Level", value: "Low" },
        { label: "Road Temp", value: "24.1°C" }
      ]
    },
    {
      id: "pin-river-north",
      type: "floodRisk",
      title: "Elbe Gauge North",
      description: "Hydrological sensor tracking Elbe water level north of the city near Herrenkrug bridge.",
      metricLabel: "Water Level",
      metricValue: "2.35 m",
      status: "Normal",
      statusColor: "text-blue-500",
      top: "21%",
      right: "35%",
      color: "bg-blue-600",
      metrics: [
        { label: "Water Level", value: "2.35 m" },
        { label: "Flow Speed", value: "1.2 m/s" },
        { label: "Status", value: "Safe" },
        { label: "Update Freq", value: "15 min" }
      ]
    },
    {
      id: "pin-river-buckau",
      type: "floodRisk",
      title: "Elbe Gauge Buckau",
      description: "Hydrological gauge measuring river heights near Buckau harbor district.",
      metricLabel: "Water Level",
      metricValue: "2.31 m",
      status: "Normal",
      statusColor: "text-blue-500",
      top: "80%",
      right: "30%",
      color: "bg-blue-600",
      metrics: [
        { label: "Water Level", value: "2.31 m" },
        { label: "Flow Speed", value: "1.1 m/s" },
        { label: "Status", value: "Safe" },
        { label: "Water Temp", value: "14.5°C" }
      ]
    },
    {
      id: "pin-aqi-mitte",
      type: "airQuality",
      title: "AQI Stadtfeld",
      description: "Ecology station monitoring atmospheric particulates (PM2.5, PM10) and ozone levels in Stadtfeld.",
      metricLabel: "AQI Score",
      metricValue: `${aqi.aqi} Good`,
      status: "Optimal",
      statusColor: "text-emerald-500",
      top: "75%",
      left: "55%",
      color: "bg-emerald-500",
      metrics: [
        { label: "AQI Score", value: `${aqi.aqi} Good` },
        { label: "PM2.5 Level", value: `${aqi.pm25} µg/m³` },
        { label: "PM10 Level", value: `${aqi.pm10} µg/m³` },
        { label: "Ozone (O3)", value: "32 µg/m³" }
      ]
    },
    {
      id: "pin-aqi-buckau",
      type: "airQuality",
      title: "AQI Buckau",
      description: "Industrial area boundary sensor logging particulate matter and nitrogen dioxide (NO2) near Buckau.",
      metricLabel: "AQI Score",
      metricValue: "55 Moderate",
      status: "Moderate",
      statusColor: "text-amber-500",
      top: "85%",
      left: "45%",
      color: "bg-emerald-500",
      metrics: [
        { label: "AQI Score", value: "55 Moderate" },
        { label: "PM2.5 Level", value: "14.2 µg/m³" },
        { label: "PM10 Level", value: "24.5 µg/m³" },
        { label: "NO2 Level", value: "18.4 µg/m³" }
      ]
    },
    {
      id: "pin-transit-hbf",
      type: "publicTransport",
      title: "Magdeburg Hbf",
      description: "Central railway station tracking real-time departures and transit delays.",
      metricLabel: "Active Trams",
      metricValue: "8 lines",
      status: "Operational",
      statusColor: "text-emerald-500",
      top: "40%",
      left: "35%",
      color: "bg-red-500",
      metrics: [
        { label: "Active Trams", value: "8 tram lines" },
        { label: "Operational", value: "98.4%" },
        { label: "Daily Boardings", value: "18,400" },
        { label: "Eco-Fleet Ratio", value: "75%" }
      ]
    },
    {
      id: "pin-transit-altermarkt",
      type: "publicTransport",
      title: "Alter Markt Tram Stop",
      description: "Main downtown tram connection intersection point near the city hall.",
      metricLabel: "Next tram",
      metricValue: "3 min",
      status: "On Time",
      statusColor: "text-emerald-500",
      top: "30%",
      right: "30%",
      color: "bg-red-500",
      metrics: [
        { label: "Next Connection", value: "Tram 2 (3 min)" },
        { label: "Queue Load", value: "Normal" },
        { label: "Operational State", value: "Active" },
        { label: "Passenger Info", value: "Online" }
      ]
    }
  ];

  const mapPins = [...staticMapPins, ...dynamicPins];

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
                    <span className="text-4xl font-black text-white tracking-tighter">81<span className="text-emerald-300 text-sm">/100</span></span>
                    <span className="text-xs font-black text-[#3cf6cc] flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ↑ 4 pts
                    </span>
                  </div>
                </div>
                <div className="border-l border-white/10 pl-5 space-y-1 text-[11px] text-emerald-100/90 font-medium">
                  <div className="flex justify-between gap-4">
                    <span className="text-emerald-200/80 font-semibold">Air Quality:</span>
                    <span className="text-[#3cf6cc] font-black">+3</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-emerald-200/80 font-semibold">Mobility:</span>
                    <span className="text-[#3cf6cc] font-black">+2</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-emerald-200/80 font-semibold">Traffic delays:</span>
                    <span className="text-rose-400 font-black">-1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Cards Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              
              {/* CARD 1: Weather */}
              <div className="bg-gradient-to-br from-white via-white to-amber-50/15 border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 hover:border-amber-400/20 transition-all duration-300 min-h-[220px]">
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
                    <span>{weather.comparison}</span>
                  </div>
                </div>
              </div>

              {/* CARD 2: Air Quality */}
              <div className="bg-gradient-to-br from-white via-white to-emerald-50/15 border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 hover:border-emerald-500/20 transition-all duration-300 min-h-[220px] text-center items-center">
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
                    <span>Slightly better than yesterday</span>
                  </div>
                </div>
              </div>

              {/* CARD 3: Mobility Status */}
              <div className="bg-gradient-to-br from-white via-white to-emerald-50/15 border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 hover:border-emerald-500/20 transition-all duration-300 min-h-[220px] text-center items-center">
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
              <div className="bg-gradient-to-br from-white via-white to-rose-50/15 border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 hover:border-orange-500/20 transition-all duration-300 min-h-[220px] text-center items-center">
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
              <div className="bg-gradient-to-br from-white via-white to-blue-50/15 border border-zinc-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 hover:border-blue-500/20 transition-all duration-300 min-h-[220px] text-center items-center">
                <div className="flex justify-between items-center text-[10px] font-black text-zinc-400 uppercase tracking-wider w-full text-left">
                  <span>Elbe hydrology</span>
                  <span className="text-blue-500 text-[11px]">🌊</span>
                </div>
                
                <div className="my-3 flex flex-col items-center gap-1">
                  <WaveIcon />
                  <div className="text-center">
                    <div className="text-2xl font-black text-zinc-955 tracking-tighter leading-none mt-1">{elbe.level.toFixed(2)} m</div>
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
                    
                    {/* Log 1: Air quality */}
                    <div className="flex gap-4 items-start bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex-shrink-0 flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <LeafIcon className="w-4 h-4 fill-emerald-100/10" />
                      </div>
                      <div className="text-[13px] leading-snug">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-zinc-800">Air quality improved</span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-150/50 px-1.5 py-0.5 rounded uppercase">ECOLOGY</span>
                        </div>
                        <p className="text-zinc-500 mt-1 font-semibold text-xs leading-normal">PM2.5 values decreased by 6 µg/m³ near the Stadtfeld sensors district.</p>
                      </div>
                    </div>

                    {/* Log 2: Traffic */}
                    <div className="flex gap-4 items-start bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-orange-50/80 flex-shrink-0 flex items-center justify-center text-orange-600 border border-orange-100">
                        <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V8h2v4z" />
                        </svg>
                      </div>
                      <div className="text-[13px] leading-snug">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-zinc-800">Delays on B1 Route</span>
                          <span className="text-[9px] font-bold text-orange-700 bg-orange-150/50 px-1.5 py-0.5 rounded uppercase">MOBILITY</span>
                        </div>
                        <p className="text-zinc-500 mt-1 font-semibold text-xs leading-normal">Collision near Olvenstedter Straße has been cleared; expect minor residual delays.</p>
                      </div>
                    </div>

                    {/* Log 3: Elbe water */}
                    <div className="flex gap-4 items-start bg-zinc-50/50 hover:bg-zinc-50 border border-zinc-100 rounded-xl p-3.5 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center text-blue-600 border border-blue-100">
                        <WaveIcon />
                      </div>
                      <div className="text-[13px] leading-snug">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-zinc-800">Elbe level rising slowly</span>
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-150/50 px-1.5 py-0.5 rounded uppercase">HYDROLOGY</span>
                        </div>
                        <p className="text-zinc-500 mt-1 font-semibold text-xs leading-normal">Mild rainfall upstream has slightly raised water gauge heights. Status remains completely safe.</p>
                      </div>
                    </div>

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
          <div className="space-y-8 animate-fadeIn text-left">
            <div>
              <h2 className="text-[26px] font-black tracking-tight text-[#0a2540]">
                Mobility & Transportation
              </h2>
              <p className="text-sm text-zinc-500 font-semibold mt-1">Real-time traffic status, transit delays queue, bicycle flows, and peak predictions.</p>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4.5 shadow-xs">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Transit Congestion</span>
                <div className="text-2xl font-black text-zinc-800 mt-1">14% <span className="text-xs font-bold text-emerald-500">(Optimal)</span></div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-1 block">Low commuter traffic density</span>
              </div>
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4.5 shadow-xs">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Daily Cyclist Vol.</span>
                <div className="text-2xl font-black text-[#0c6b5b] mt-1">4,120 <span className="text-xs font-bold text-[#0c6b5b]">(Active)</span></div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-1 block">Peak trail: Elberadweg route</span>
              </div>
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4.5 shadow-xs">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Avg MVB Delay</span>
                <div className="text-2xl font-black text-zinc-800 mt-1">2.1 min</div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-1 block">Trams running at 98.4% consistency</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Transit Delays List */}
              <div className="lg:col-span-6 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-[16px] font-black text-[#0a2540] mb-4 flex items-center gap-2">
                  🚌 Live MVB Transit Delay Queue
                </h3>
                
                <div className="divide-y divide-zinc-100">
                  {transitDelays.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center py-3 first:pt-0 last:pb-0 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="font-extrabold text-zinc-800">{t.line}</span>
                      </div>
                      <span className={`font-black px-2.5 py-0.5 rounded-lg text-xs ${
                        t.delay === "0 min" ? "bg-green-50 text-emerald-600 border border-green-200" : "bg-amber-50 text-amber-600 border border-amber-200"
                      }`}>
                        {t.delay === "0 min" ? "On Time" : `+${t.delay}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peak Hours Congestion Prediction Chart */}
              <div className="lg:col-span-6 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-[16px] font-black text-[#0a2540] mb-3">Peak Commuter Hours (Congestion Forecast)</h3>
                  <p className="text-[11px] text-zinc-400 font-semibold mb-4">Real-time prediction of transit load density index across the day.</p>
                  
                  {/* SVG line chart */}
                  <div className="relative h-36 w-full mt-2">
                    <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                      <line x1="0" y1="20" x2="300" y2="20" stroke="#f8fafc" strokeWidth="1.5" />
                      <line x1="0" y1="50" x2="300" y2="50" stroke="#f8fafc" strokeWidth="1.5" />
                      <line x1="0" y1="80" x2="300" y2="80" stroke="#f8fafc" strokeWidth="1.5" />
                      
                      {/* Peak chart line */}
                      <path
                        d="M 10 90 Q 50 85 70 30 T 95 60 T 150 90 T 210 20 T 260 70 T 290 85"
                        fill="none"
                        stroke="#0c6b5b"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      
                      {/* AM Peak Marker */}
                      <circle cx="70" cy="30" r="4.5" fill="#f97316" stroke="white" strokeWidth="2" />
                      {/* PM Peak Marker */}
                      <circle cx="210" cy="20" r="4.5" fill="#f97316" stroke="white" strokeWidth="2" />
                    </svg>
                    <div className="flex justify-between text-[9.5px] text-zinc-400 font-extrabold mt-2 px-1">
                      <span>06:00 AM</span>
                      <span>09:00 AM (AM Peak)</span>
                      <span>01:00 PM</span>
                      <span>05:00 PM (PM Peak)</span>
                      <span>08:00 PM</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#eefcf7] border border-green-200/80 rounded-xl p-3 text-[11px] text-[#3c6b5d] font-semibold mt-4">
                  💡 <strong>Smart Routing:</strong> Selecting routes bypassing B1 during peak AM (07:45 - 08:30) saves an average of 9 minutes per commute.
                </div>
              </div>

            </div>

            {/* Smart Mobility Infrastructure Card */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs">
              <h3 className="text-[16px] font-black text-[#0a2540] mb-4">Magdeburg Eco-Transit Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Sudenburg Electric Bus Corridors", progress: 60, district: "Sudenburg", status: "In Progress" },
                  { name: "Altstadt Smart Parking Grid", progress: 85, district: "Altstadt", status: "Near Completion" }
                ].map((proj, idx) => (
                  <div key={idx} className="border border-zinc-100 rounded-xl p-4 bg-zinc-50/40 space-y-2">
                    <div className="flex justify-between items-center text-xs font-extrabold">
                      <span className="text-[#0a2540]">{proj.name}</span>
                      <span className="text-[#0c6b5b]">{proj.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0c6b5b] rounded-full" style={{ width: `${proj.progress}%` }} />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-semibold block mt-1">Status: {proj.status} • {proj.progress}% optimized routing implemented</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: Environment View */}
        {activeTab === "environment" && (
          <div className="space-y-8 animate-fadeIn text-left">
            <div>
              <h2 className="text-[26px] font-black tracking-tight text-[#0a2540]">
                Ecology & Air Quality
              </h2>
              <p className="text-sm text-zinc-500 font-semibold mt-1">Localized district sensor monitoring, PM2.5 trends, noise indices, and green cover.</p>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4.5 shadow-xs">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">City Avg AQI</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{aqi.aqi} <span className="text-xs font-bold text-emerald-500">Good</span></div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-1 block">Atmospheric indexes optimal</span>
              </div>
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4.5 shadow-xs">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Carbon Absorption</span>
                <div className="text-2xl font-black text-zinc-800 mt-1">12,400 <span className="text-xs font-bold text-zinc-400">t/year</span></div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-1 block">Supported by municipal parks</span>
              </div>
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-4.5 shadow-xs">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">Noise Pollution Index</span>
                <div className="text-2xl font-black text-zinc-800 mt-1">52 dB</div>
                <span className="text-[10px] text-zinc-400 font-semibold mt-1 block">Comfortable urban threshold</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Local Air Quality by District */}
              <div className="lg:col-span-6 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-[16px] font-black text-[#0a2540] mb-4">Ecology Metric by District</h3>
                
                <div className="space-y-3">
                  {[
                    { district: "Altstadt Center", aqiVal: 32, status: "Good", color: "bg-emerald-500" },
                    { district: "Stadtfeld Area", aqiVal: 42, status: "Good", color: "bg-emerald-500" },
                    { district: "Buckau Riverbanks", aqiVal: 55, status: "Moderate", color: "bg-amber-500" },
                    { district: "Sudenburg Junction", aqiVal: 38, status: "Good", color: "bg-emerald-500" }
                  ].map((dist, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border border-zinc-50 rounded-xl">
                      <span className="text-xs font-black text-zinc-800">{dist.district}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-zinc-500">AQI: {dist.aqiVal}</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${dist.color}`}></span>
                        <span className="text-[10.5px] font-black uppercase text-zinc-700 min-w-[65px] text-right">{dist.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PM2.5 Trends Chart */}
              <div className="lg:col-span-6 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-[16px] font-black text-[#0a2540] mb-3">PM2.5 Atmospheric Trends</h3>
                  <p className="text-[11px] text-zinc-400 font-semibold mb-4">Weekly atmospheric fine particulates monitoring (μg/m³).</p>
                  
                  {/* SVG Area Chart */}
                  <div className="relative h-36 w-full mt-2">
                    <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                      <line x1="0" y1="20" x2="300" y2="20" stroke="#f8fafc" strokeWidth="1.5" />
                      <line x1="0" y1="50" x2="300" y2="50" stroke="#f8fafc" strokeWidth="1.5" />
                      <line x1="0" y1="80" x2="300" y2="80" stroke="#f8fafc" strokeWidth="1.5" />
                      
                      {/* Gradient background path */}
                      <path
                        d="M 10 75 Q 60 70 100 45 T 200 35 T 290 25 L 290 100 L 10 100 Z"
                        fill="rgba(12, 107, 91, 0.08)"
                      />
                      
                      {/* Main line */}
                      <path
                        d="M 10 75 Q 60 70 100 45 T 200 35 T 290 25"
                        fill="none"
                        stroke="#0c6b5b"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      
                      <circle cx="290" cy="25" r="4" fill="#0c6b5b" stroke="white" strokeWidth="1.5" />
                    </svg>
                    <div className="flex justify-between text-[9.5px] text-zinc-400 font-extrabold mt-2 px-1">
                      <span>Mon (14.2)</span>
                      <span>Wed (11.5)</span>
                      <span>Fri (9.8)</span>
                      <span>Today ({aqi.pm25} μg/m³)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#eefcf7] border border-green-200/80 rounded-xl p-3 text-[11px] text-[#3c6b5d] font-semibold mt-4">
                  🍃 <strong>Target Met:</strong> Magdeburg fine particulate indices are sitting 18% lower than the strict European Union thresholds.
                </div>
              </div>

            </div>

            {/* Tree Canopy and Waste Management Metrics */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs">
              <h3 className="text-[16px] font-black text-[#0a2540] mb-4">Sustainability Indicators</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-zinc-100 rounded-xl p-4 bg-zinc-50/40">
                  <span className="text-xs text-zinc-400 font-bold uppercase">Tree Canopy Cover</span>
                  <div className="text-2xl font-black text-zinc-800 mt-1">24.5%</div>
                  <div className="w-full h-2 bg-zinc-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: "81%" }} />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-semibold block mt-1">Target: 30% urban canopy cover by 2030</span>
                </div>
                <div className="border border-zinc-100 rounded-xl p-4 bg-zinc-50/40">
                  <span className="text-xs text-zinc-400 font-bold uppercase">Waste Collection Optimization</span>
                  <div className="text-2xl font-black text-zinc-800 mt-1">92%</div>
                  <div className="w-full h-2 bg-zinc-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: "92%" }} />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-semibold block mt-1">Smart containers routes efficiency score</span>
                </div>
              </div>
            </div>

          </div>
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
              
              {/* Rental Index by District */}
              <div className="lg:col-span-6 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs">
                <h3 className="text-[16px] font-black text-[#0a2540] mb-4">Average Rent Price by District</h3>
                
                <div className="space-y-3">
                  {[
                    { district: "Altstadt Center", rent: "€11.20 / m²", status: "Premium", color: "bg-orange-500" },
                    { district: "Stadtfeld Area", rent: "€9.10 / m²", status: "Moderate", color: "bg-amber-500" },
                    { district: "Buckau Riverbanks", rent: "€8.80 / m²", status: "Moderate", color: "bg-amber-500" },
                    { district: "Sudenburg Junction", rent: "€7.90 / m²", status: "Accessible", color: "bg-emerald-500" },
                    { district: "Olvenstedt Suburb", rent: "€6.50 / m²", status: "Accessible", color: "bg-emerald-500" }
                  ].map((dist, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border border-zinc-50 rounded-xl">
                      <span className="text-xs font-black text-zinc-800">{dist.district}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-zinc-900">{dist.rent}</span>
                        <span className={`w-2 h-2 rounded-full ${dist.color}`}></span>
                        <span className="text-[10px] font-black uppercase text-zinc-650 min-w-[70px] text-right">{dist.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rental Price Growth Chart */}
              <div className="lg:col-span-6 bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-[15.5px] font-black text-[#0a2540] mb-3">5-Year Rental Price Index Trend</h3>
                  <p className="text-[11px] text-zinc-400 font-semibold mb-4">Average monthly rent progression over the last 5 years in Magdeburg (€/m²).</p>
                  
                  {/* SVG Area Chart */}
                  <div className="relative h-40 w-full mt-2">
                    <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                      <line x1="0" y1="20" x2="300" y2="20" stroke="#f8fafc" strokeWidth="1.5" />
                      <line x1="0" y1="50" x2="300" y2="50" stroke="#f8fafc" strokeWidth="1.5" />
                      <line x1="0" y1="80" x2="300" y2="80" stroke="#f8fafc" strokeWidth="1.5" />
                      
                      {/* Area background */}
                      <path
                        d="M 10 85 Q 80 78 150 50 T 290 25 L 290 100 L 10 100 Z"
                        fill="rgba(12, 107, 91, 0.08)"
                      />
                      
                      {/* Line path */}
                      <path
                        d="M 10 85 Q 80 78 150 50 T 290 25"
                        fill="none"
                        stroke="#0c6b5b"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      
                      <circle cx="290" cy="25" r="4.5" fill="#0c6b5b" stroke="white" strokeWidth="2" />
                    </svg>
                    <div className="flex justify-between text-[9.5px] text-zinc-450 font-extrabold mt-2 px-1">
                      <span>2022 (€7.20)</span>
                      <span>2024 (€7.85)</span>
                      <span>2025 (€8.20)</span>
                      <span>Today (€8.55)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#eefcf7] border border-green-200/80 rounded-xl p-3 text-[11px] text-[#3c6b5d] font-semibold mt-4">
                  🏢 <strong>Rent Cap Monitoring:</strong> Active regulation tracking ensures new rental lease listings stay within local index limits.
                </div>
              </div>

            </div>

            {/* Affordable Housing Construction Progress */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs">
              <h3 className="text-[16px] font-black text-[#0a2540] mb-4">Affordable Residential Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
                {[
                  { name: "Sudenburg Eco-Housing (Stage 1)", progress: 85, units: 140, completion: "Q3 2026" },
                  { name: "Buckau Riverfront Social Lofts", progress: 40, units: 95, completion: "Q2 2027" },
                  { name: "Neustadt Municipal Re-Development", progress: 65, units: 210, completion: "Q4 2026" }
                ].map((proj, idx) => (
                  <div key={idx} className="border border-zinc-150 rounded-xl p-4 bg-zinc-50/40 space-y-2 text-left">
                    <div className="flex justify-between items-start text-xs font-black">
                      <span className="text-[#0a2540] line-clamp-1">{proj.name}</span>
                      <span className="text-[#0c6b5b]">{proj.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0c6b5b] rounded-full" style={{ width: `${proj.progress}%` }} />
                    </div>
                    <div className="flex justify-between text-[9.5px] text-zinc-400 font-semibold pt-1">
                      <span>{proj.units} units</span>
                      <span>Target: {proj.completion}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Full Screen Interactive Map View */}
        {activeTab === "map" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-fadeIn">
            
            {/* Sidebar Filters */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#0a2540]">
                  Interactive Sensors Map
                </h2>
                <p className="text-[12.5px] text-zinc-500 font-semibold mt-1">Toggle filter categories and tap any node to inspect real-time metrics.</p>
              </div>

              {/* Unified Sidebar Panel */}
              <div className="bg-white border border-zinc-200/85 rounded-3xl p-5 shadow-xs flex flex-col gap-4 border-zinc-250/60 flex-1">
                
                {/* Checklist Section */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-3">Sensor Layers</h3>
                  
                  <label className="flex items-center gap-3 cursor-pointer text-[13.5px] font-bold text-zinc-700 hover:text-[#0c6b5b] select-none transition-colors">
                    <input 
                      type="checkbox" 
                      checked={mapFilters.publicTransport} 
                      onChange={() => setMapFilters({...mapFilters, publicTransport: !mapFilters.publicTransport})}
                      className="custom-checkbox cursor-pointer"
                    />
                    <span>🚌 Transit Hubs & Trams</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer text-[13.5px] font-bold text-zinc-700 hover:text-[#0c6b5b] select-none transition-colors">
                    <input 
                      type="checkbox" 
                      checked={mapFilters.airQuality} 
                      onChange={() => setMapFilters({...mapFilters, airQuality: !mapFilters.airQuality})}
                      className="custom-checkbox cursor-pointer"
                    />
                    <span>🍃 Air Quality Sensors</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer text-[13.5px] font-bold text-zinc-700 hover:text-[#0c6b5b] select-none transition-colors">
                    <input 
                      type="checkbox" 
                      checked={mapFilters.floodRisk} 
                      onChange={() => setMapFilters({...mapFilters, floodRisk: !mapFilters.floodRisk})}
                      className="custom-checkbox cursor-pointer"
                    />
                    <span>🌊 Elbe River Water Gauges</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer text-[13.5px] font-bold text-zinc-700 hover:text-[#0c6b5b] select-none transition-colors">
                    <input 
                      type="checkbox" 
                      checked={mapFilters.traffic} 
                      onChange={() => setMapFilters({...mapFilters, traffic: !mapFilters.traffic})}
                      className="custom-checkbox cursor-pointer"
                    />
                    <span>🚗 Traffic Telemetry</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer text-[13.5px] font-bold text-zinc-700 hover:text-[#0c6b5b] select-none transition-colors">
                    <input 
                      type="checkbox" 
                      checked={mapFilters.schools} 
                      onChange={() => setMapFilters({...mapFilters, schools: !mapFilters.schools})}
                      className="custom-checkbox cursor-pointer"
                    />
                    <span>🏫 Smart Schools & Edu</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer text-[13.5px] font-bold text-zinc-700 hover:text-[#0c6b5b] select-none transition-colors">
                    <input 
                      type="checkbox" 
                      checked={mapFilters.greenAreas} 
                      onChange={() => setMapFilters({...mapFilters, greenAreas: !mapFilters.greenAreas})}
                      className="custom-checkbox cursor-pointer"
                    />
                    <span>🌳 Canopy & Park Nodes</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer text-[13.5px] font-bold text-zinc-700 hover:text-[#0c6b5b] select-none transition-colors">
                    <input 
                      type="checkbox" 
                      checked={mapFilters.hospitals} 
                      onChange={() => setMapFilters({...mapFilters, hospitals: !mapFilters.hospitals})}
                      className="custom-checkbox cursor-pointer"
                    />
                    <span>🏥 Hospitals & Clinics</span>
                  </label>
                </div>

                {/* Divider Line */}
                <div className="border-t border-zinc-150/80 my-4.5" />

                {/* Detail Telemetry Section */}
                <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-4.5 flex flex-col justify-start">
                  {selectedMapPin ? (
                    <div className="space-y-3.5 w-full">
                      <div className="flex justify-between items-center">
                        <span className="text-[14.5px] font-black text-[#0a2540] tracking-tight">{selectedMapPin.title}</span>
                        <div className="flex items-center gap-1.5">
                          {isSyncingLive && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-white border rounded-md ${selectedMapPin.statusColor} border-zinc-200/50 shadow-2xs`}>
                            {selectedMapPin.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11.5px] text-zinc-500 font-semibold leading-relaxed line-clamp-2">{selectedMapPin.description}</p>
                      
                      {/* 2x2 Grid of 4 metrics */}
                      <div className="grid grid-cols-2 gap-2.5 border-t border-zinc-200/80 pt-3">
                        {selectedMapPin.metrics?.map((m: any, idx: number) => (
                          <div key={idx} className="bg-white border border-zinc-150 p-2.5 rounded-xl text-left shadow-3xs">
                            <span className="text-[8.5px] text-zinc-400 font-black uppercase block tracking-wider">{m.label}</span>
                            <span className="text-[12px] font-black text-zinc-800 mt-0.5 block leading-none">{m.value}</span>
                          </div>
                        )) || (
                          <div className="col-span-2 bg-white border border-zinc-150 p-2.5 rounded-xl text-left">
                            <span className="text-[8.5px] text-zinc-400 font-black uppercase block tracking-wider">{selectedMapPin.metricLabel}</span>
                            <span className="text-[12px] font-black text-zinc-800 mt-0.5 block leading-none">{selectedMapPin.metricValue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-zinc-400 text-[12.5px] font-bold leading-relaxed px-4">
                      💡 Click on any active pin on the map to show detailed 2×2 telemetry metrics.
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Large Map Panel */}
            <div className="lg:col-span-8">
              <SensorMap
                mapPins={mapPins}
                mapFilters={mapFilters}
                selectedMapPin={selectedMapPin}
                setSelectedMapPin={setSelectedMapPin}
              />
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
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742h.01m3.999 0h.01M9 16.5h6m-12-3h18a2 2 0 002-2V7a2 2 0 00-2-2H3a2 2 0 00-2 2v4.5a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-black leading-none">Ottobot</h4>
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
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-zinc-200/85 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs text-zinc-400 flex items-center gap-1.5 shadow-xs font-semibold">
                    <span>Ottobot is thinking</span>
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
            <svg className="w-6.5 h-6.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742h.01m3.999 0h.01M9 16.5h6m-12-3h18a2 2 0 002-2V7a2 2 0 00-2-2H3a2 2 0 00-2 2v4.5a2 2 0 002 2z" />
            </svg>
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
