"use client";

import { useState } from "react";

type MapPin = {
  id: string;
  type: string;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  status: string;
  statusColor: string;
  top: string;
  left?: string;
  right?: string;
  color: string;
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
    top: "32%",
    right: "22%",
    color: "bg-sky-500",
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
    top: "21%",
    right: "35%",
    color: "bg-blue-600",
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
    color: "bg-orange-500",
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
    top: "75%",
    left: "55%",
    color: "bg-emerald-500",
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
    color: "bg-indigo-500",
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
    color: "bg-green-600",
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
    color: "bg-red-500",
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
  });
  const [selectedMapPin, setSelectedMapPin] = useState<MapPin | null>(null);

  return (
    <main className="w-full max-w-[1450px] mx-auto p-6 lg:p-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-[#0a2540]">Interactive Sensors Map</h1>
          <p className="text-sm text-zinc-500 mt-2">Toggle filter layers and click any active pin to inspect live telemetry.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Sensor Layers</h2>
                <p className="text-xs text-zinc-500 mt-2">Show or hide categories of sensor telemetry displayed on the city map.</p>
              </div>

              {([
                { key: "publicTransport", label: "🚌 Transit Hubs & Trams" },
                { key: "airQuality", label: "🍃 Air Quality Sensors" },
                { key: "floodRisk", label: "🌊 Elbe River Water Gauges" },
                { key: "traffic", label: "🚗 Traffic Telemetry" },
                { key: "schools", label: "🏫 Smart Schools & Edu" },
                { key: "greenAreas", label: "🌳 Canopy & Park Nodes" },
              ] as const).map((layer) => (
                <label key={layer.key} className="flex items-center gap-3 cursor-pointer text-sm font-bold text-zinc-700 hover:text-zinc-900">
                  <input
                    type="checkbox"
                    checked={mapFilters[layer.key]}
                    onChange={() => setMapFilters((prev) => ({ ...prev, [layer.key]: !prev[layer.key] }))}
                    className="w-4 h-4 rounded text-[#0c6b5b] focus:ring-[#0c6b5b] cursor-pointer"
                  />
                  <span>{layer.label}</span>
                </label>
              ))}
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 shadow-xs">
              {selectedMapPin ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-[#0a2540]">{selectedMapPin.title}</h3>
                      <p className="text-sm text-zinc-500 mt-1">{selectedMapPin.description}</p>
                    </div>
                    <span className={`text-xs font-extrabold ${selectedMapPin.statusColor}`}>{selectedMapPin.status}</span>
                  </div>
                  <div className="border-t border-zinc-200/80 pt-4 grid grid-cols-2 gap-3 text-left">
                    <div className="bg-white rounded-2xl border border-zinc-150 p-3 shadow-3xs">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400">{selectedMapPin.metricLabel}</p>
                      <p className="text-base font-black text-zinc-900 mt-2">{selectedMapPin.metricValue}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-zinc-150 p-3 shadow-3xs">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400">Status</p>
                      <p className="text-base font-black text-zinc-900 mt-2">{selectedMapPin.status}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-400 text-sm font-bold">
                  💡 Click an active pin on the map to show detailed telemetry metrics.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-zinc-200/95 shadow-sm bg-zinc-50">
              <img
                src="/magdeburg-map.png"
                alt="Magdeburg interactive map"
                className="w-full h-full object-cover"
              />

              {mapPins
                .filter((pin) => mapFilters[pin.type as keyof typeof mapFilters])
                .map((pin) => (
                  <button
                    key={pin.id}
                    onClick={() => setSelectedMapPin(pin)}
                    style={{ top: pin.top, left: pin.left, right: pin.right }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-125 focus:outline-none ${pin.color} text-white`}
                  >
                    <span className="w-2.5 h-2.5 bg-white rounded-full" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
