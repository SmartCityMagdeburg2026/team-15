"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Interface for map pins
interface MapPin {
  id: string;
  type: string;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  status: string;
  statusColor: string;
  top: string;
  right?: string;
  left?: string;
  color: string;
  metrics?: { label: string; value: string }[];
  lat?: number;
  lng?: number;
}

interface SensorMapProps {
  mapPins: MapPin[];
  mapFilters: {
    airQuality: boolean;
    traffic: boolean;
    floodRisk: boolean;
    schools: boolean;
    greenAreas: boolean;
    publicTransport: boolean;
    hospitals: boolean;
  };
  selectedMapPin: any;
  setSelectedMapPin: (pin: MapPin | null) => void;
}

// Hardcoded real coordinate mappings for the Magdeburg IoT sensors
const pinCoordinates: Record<string, [number, number]> = {
  "pin-school-dom": [52.1285, 11.6390],
  "pin-school-ovgu": [52.1194, 11.6271],
  "pin-school-berufsschule": [52.1340, 11.6150],
  "pin-park-rotehorn": [52.1190, 11.6640],
  "pin-park-nordpark": [52.1420, 11.6200],
  "pin-park-herrenkrug": [52.1280, 11.6780],
  "pin-delay-b1": [52.1200, 11.6350],
  "pin-traffic-stadtring": [52.1310, 11.6180],
  "pin-river-north": [52.1398, 11.6480],
  "pin-river-buckau": [52.1090, 11.6550],
  "pin-aqi-mitte": [52.1150, 11.6150],
  "pin-aqi-buckau": [52.1080, 11.6420],
  "pin-transit-hbf": [52.1302, 11.6276],
  "pin-transit-altermarkt": [52.1255, 11.6362],
};

// Emoji map matching sensor types
const emojiMap: Record<string, string> = {
  airQuality: "🍃",
  floodRisk: "🌊",
  traffic: "🚗",
  publicTransport: "🚌",
  schools: "🏫",
  greenAreas: "🌳",
  hospitals: "🏥",
};

// Generates custom HTML/SVG pulsing icons matching original dashboard aesthetics with white badge
const getMarkerIcon = (color: string, type: string) => {
  let hexColor = "#0c6b5b";
  if (color.includes("bg-sky-500")) hexColor = "#0ea5e9";
  else if (color.includes("bg-blue-600")) hexColor = "#2563eb";
  else if (color.includes("bg-orange-500")) hexColor = "#f97316";
  else if (color.includes("bg-emerald-500") || color.includes("bg-green-600")) hexColor = "#10b981";
  else if (color.includes("bg-indigo-500")) hexColor = "#6366f1";
  else if (color.includes("bg-red-500")) hexColor = "#ef4444";
  else if (color.includes("bg-rose-500")) hexColor = "#f43f5e";

  const emoji = emojiMap[type] || "📍";

  return L.divIcon({
    html: `
      <div style="
        position: relative; 
        width: 36px; 
        height: 36px; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        background-color: white;
        border: 2px solid ${hexColor};
        border-radius: 50%;
        box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 1px 2px rgba(0,0,0,0.23);
        animation: pulse 2s ease-in-out infinite;
        cursor: pointer;
      ">
        <span style="font-size: 20px; line-height: 1;">${emoji}</span>
      </div>
    `,
    className: "custom-leaflet-pin-wrapper",
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

export default function SensorMap({ mapPins, mapFilters, selectedMapPin, setSelectedMapPin }: SensorMapProps) {
  // Center of Magdeburg
  const center: [number, number] = [52.1205, 11.6276];

  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    setMapKey(prev => prev + 1);
  }, []);

  return (
    <div style={{ height: "560px", width: "100%" }} className="rounded-3xl overflow-hidden border border-zinc-200/90 shadow-sm relative z-0">
      <MapContainer 
        key={mapKey}
        center={center} 
        zoom={14} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {mapPins
          .filter(pin => mapFilters[pin.type as keyof typeof mapFilters])
          .map(pin => {
            const coords: [number, number] = pin.lat !== undefined && pin.lng !== undefined
              ? [pin.lat, pin.lng]
              : (pinCoordinates[pin.id] || center);
            return (
              <Marker
                key={pin.id}
                position={coords}
                icon={getMarkerIcon(pin.color, pin.type)}
                eventHandlers={{
                  click: () => {
                    setSelectedMapPin(pin);
                  }
                }}
              />
            );
          })}
      </MapContainer>
    </div>
  );
}
