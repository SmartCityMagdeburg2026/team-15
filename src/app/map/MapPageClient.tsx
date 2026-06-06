"use client";

import { useState } from "react";
import SensorMap from "@/components/SensorMap";

type MapPin = {
  id: string;
  type: string;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  status: string;
  statusColor: string;
  top?: string;
  left?: string;
  right?: string;
  color?: string;
  lat?: number;
  lng?: number;
  metrics?: { label: string; value: string }[];
};

const mapPins: MapPin[] = [
  {
    id: "pin-weather-east",
    type: "airQuality",
    title: "Weather Station East",
    description: "Atmospheric telemetry node recording temperature, humidity and air velocity.",
    metricLabel: "Temperature",
    metricValue: "18°C",
    status: "Active",
    statusColor: "text-blue-500",
    lat: 52.125,
    lng: 11.64,
    color: "#60a5fa",
  },
  {
    id: "pin-river-strombruecke",
    type: "floodRisk",
    title: "Elbe River Gauge Node",
    description: "Hydrological ultrasonic sensor tracking water levels relative to standard levels.",
    metricLabel: "Level",
    metricValue: "2.35 m",
    status: "Normal",
    statusColor: "text-blue-500",
    lat: 52.128,
    lng: 11.678,
    color: "#3b82f6",
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
    lat: 52.13,
    lng: 11.62,
    color: "#fb923c",
  },
  {
    id: "pin-aqi-mitte",
    type: "airQuality",
    title: "AQI Station - Stadtfeld",
    description: "Ecology station monitoring atmospheric particulates (PM2.5, PM10) and ozone levels.",
    metricLabel: "Air Quality",
    metricValue: "42 Good",
    status: "Optimal",
    statusColor: "text-emerald-500",
    lat: 52.12,
    lng: 11.6276,
    color: "#10b981",
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
    lat: 52.118,
    lng: 11.62,
    color: "#6366f1",
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
    lat: 52.119,
    lng: 11.664,
    color: "#16a34a",
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
    lat: 52.1289,
    lng: 11.6271,
    color: "#ef4444",
  },
];

export default function MapPageClient() {
  const [mapFilters, setMapFilters] = useState({
    airQuality: true,
    traffic: true,
    floodRisk: true,
    schools: true,
    greenAreas: true,
    publicTransport: true,
    hospitals: true,
  });
  const [selectedMapPin, setSelectedMapPin] = useState<MapPin | null>(null);
  const [isSyncingLive, setIsSyncingLive] = useState(false);

  return (
    <main className="w-full max-w-[1450px] mx-auto p-6 lg:p-10">
      <div className="space-y-6 animate-fadeIn text-left">
        <div className="pb-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#16a34a] mb-1">City pulse</p>
          <h1 className="text-[28px] sm:text-[34px] font-black tracking-tight text-[#0a2540] leading-none">
            Interactive Sensors Map
          </h1>
          <p className="text-sm text-zinc-500 font-semibold mt-2">Toggle filter categories and tap any node to inspect real-time metrics.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Sensor Layers</h2>
                <p className="text-xs text-zinc-500 mt-2">Toggle sensor categories displayed on the interactive map.</p>
              </div>

              {([
                { key: "publicTransport", label: "🚌 Transit Hubs & Trams" },
                { key: "airQuality", label: "🍃 Air Quality Sensors" },
                { key: "floodRisk", label: "🌊 Elbe River Water Gauges" },
                { key: "traffic", label: "🚗 Traffic Telemetry" },
                { key: "schools", label: "🏫 Smart Schools & Edu" },
                { key: "greenAreas", label: "🌳 Canopy & Park Nodes" },
                { key: "hospitals", label: "🏥 Hospitals & Clinics" },
              ] as const).map((layer) => (
                <label key={layer.key} className="flex items-center gap-3 cursor-pointer text-[13.5px] font-bold text-zinc-700 hover:text-[#0c6b5b] select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={(mapFilters as any)[layer.key]}
                    onChange={() => setMapFilters((prev) => ({ ...prev, [layer.key]: !(prev as any)[layer.key] }))}
                    className="custom-checkbox cursor-pointer"
                  />
                  <span>{layer.label}</span>
                </label>
              ))}
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 shadow-xs flex-1">
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

                  <div className="grid grid-cols-2 gap-2.5 border-t border-zinc-200/80 pt-3">
                    {selectedMapPin.metrics ? (
                      selectedMapPin.metrics.slice(0, 4).map((m, idx) => (
                        <div key={idx} className="bg-white border border-zinc-150 p-2.5 rounded-xl text-left shadow-3xs">
                          <span className="text-[8.5px] text-zinc-400 font-black uppercase block tracking-wider">{m.label}</span>
                          <span className="text-[12px] font-black text-zinc-800 mt-0.5 block leading-none">{m.value}</span>
                        </div>
                      ))
                    ) : (
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

          <div className="lg:col-span-8">
            <SensorMap
              mapPins={mapPins}
              mapFilters={mapFilters}
              selectedMapPin={selectedMapPin}
              setSelectedMapPin={setSelectedMapPin}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
