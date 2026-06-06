"use client";

import { useEffect, useRef, useState } from "react";

interface DisruptionMarker {
  lat: number;
  lon: number;
  note: string;
}

interface MobilityMapProps {
  disruptions?: DisruptionMarker[];
}

// Curated corridors for Magdeburg
const CORRIDORS = [
  {
    name: "City Centre Corridor",
    color: "#10b981",
    weight: 4,
    points: [
      [52.1305, 11.6376] as [number, number],
      [52.1250, 11.6300] as [number, number],
      [52.1205, 11.6276] as [number, number],
      [52.1170, 11.6230] as [number, number],
    ],
  },
  {
    name: "Main Station Corridor",
    color: "#10b981",
    weight: 4,
    points: [
      [52.1350, 11.6200] as [number, number],
      [52.1305, 11.6240] as [number, number],
      [52.1280, 11.6276] as [number, number],
    ],
  },
  {
    name: "Campus / University Corridor",
    color: "#f97316",
    weight: 4,
    points: [
      [52.1390, 11.6476] as [number, number],
      [52.1355, 11.6410] as [number, number],
      [52.1320, 11.6380] as [number, number],
    ],
  },
  {
    name: "East-West Connector",
    color: "#10b981",
    weight: 3,
    points: [
      [52.1200, 11.5950] as [number, number],
      [52.1205, 11.6176] as [number, number],
      [52.1205, 11.6376] as [number, number],
      [52.1200, 11.6650] as [number, number],
    ],
  },
];

const DEFAULT_DISRUPTIONS: DisruptionMarker[] = [
  { lat: 52.1350, lon: 11.6200, note: "Minor delay near Hauptbahnhof" },
  { lat: 52.1390, lon: 11.6476, note: "Roadworks affecting campus corridor" },
];

export default function MobilityMap({ disruptions = DEFAULT_DISRUPTIONS }: MobilityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [mapError, setMapError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstanceRef.current) return;

    let L: typeof import("leaflet");
    let map: import("leaflet").Map;

    async function initMap() {
      try {
        L = (await import("leaflet")).default;

        // Fix Leaflet default icon path issue with bundlers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        if (!mapRef.current) return;

        map = L.map(mapRef.current, {
          center: [52.1205, 11.6276],
          zoom: 13,
          zoomControl: true,
          attributionControl: false,
        });

        // Light OSM tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
        }).addTo(map);

        // Attribution (minimal)
        L.control.attribution({ prefix: "© OpenStreetMap" }).addTo(map);

        // Draw corridors
        for (const corridor of CORRIDORS) {
          L.polyline(corridor.points, {
            color: corridor.color,
            weight: corridor.weight,
            opacity: 0.85,
            smoothFactor: 1.5,
          })
            .bindTooltip(corridor.name, { sticky: true, className: "mobility-tooltip" })
            .addTo(map);
        }

        // Custom disruption icon
        const disruptionIcon = L.divIcon({
          className: "",
          html: `<div style="
            width:28px;height:28px;border-radius:50%;
            background:#f97316;border:2.5px solid #fff;
            box-shadow:0 2px 6px rgba(0,0,0,0.18);
            display:flex;align-items:center;justify-content:center;
            font-size:14px;line-height:1;
          ">⚠</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        // Draw disruption markers
        for (const d of disruptions) {
          L.marker([d.lat, d.lon], { icon: disruptionIcon })
            .bindPopup(
              `<div style="font-size:12px;font-weight:600;color:#0f172a;max-width:180px;">${d.note}</div>`,
              { maxWidth: 200, className: "mobility-popup" }
            )
            .addTo(map);
        }

        mapInstanceRef.current = map;
      } catch {
        setMapError(true);
      }
    }

    initMap();

    return () => {
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mounted, disruptions]);

  if (mapError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-zinc-50 rounded-xl border border-zinc-200">
        <svg className="w-8 h-8 text-zinc-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503-10.498l4.875 2.437M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <p className="text-sm font-semibold text-zinc-500">Map details are temporarily unavailable.</p>
        <p className="text-xs text-zinc-400">Summary indicators are still up to date.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .mobility-tooltip {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .mobility-tooltip::before { display: none; }
        .mobility-popup .leaflet-popup-content-wrapper {
          border-radius: 10px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          border: 1px solid #e2e8f0;
          padding: 0;
        }
        .mobility-popup .leaflet-popup-content {
          margin: 10px 14px;
        }
        .mobility-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
      <div
        ref={mapRef}
        className="w-full h-full rounded-xl overflow-hidden"
        style={{ minHeight: "260px" }}
      />
    </>
  );
}
