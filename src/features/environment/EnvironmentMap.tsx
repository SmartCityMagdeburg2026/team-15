"use client";

import { useEffect, useRef, useState } from "react";

// ── Typed geometry definitions ─────────────────────────────────────────────

interface GreenZone {
  name: string;
  note: string;
  center: [number, number];
  radius: number; // metres
  color: string;
}

interface Corridor {
  name: string;
  note: string;
  points: [number, number][];
  color: string;
  dashArray?: string;
}

interface ExposedZone {
  name: string;
  note: string;
  center: [number, number];
  radius: number;
}

// ── Static geometry data for Magdeburg ────────────────────────────────────

const GREEN_ZONES: GreenZone[] = [
  {
    name: "Stadtpark Rotehorn",
    note: "Large park on the Elbe island. Cooler and shadier — ideal for outdoor walks today.",
    center: [52.1090, 11.6620],
    radius: 650,
    color: "#22c55e",
  },
  {
    name: "Elbauenpark",
    note: "Green riverside park with open meadows. Good ventilation and shade.",
    center: [52.1500, 11.6250],
    radius: 500,
    color: "#22c55e",
  },
  {
    name: "Nordpark",
    note: "Northern green corridor. Quieter and fresher than central areas.",
    center: [52.1520, 11.6440],
    radius: 280,
    color: "#4ade80",
  },
  {
    name: "Glacis Park",
    note: "Historic city park near the old fortifications. Good shade and fresh air.",
    center: [52.1270, 11.6180],
    radius: 260,
    color: "#4ade80",
  },
];

const COOL_CORRIDORS: Corridor[] = [
  {
    name: "Elbe Riverbank Corridor",
    note: "The Elbe riverbanks are cooler due to river ventilation. Comfortable for outdoor activity.",
    color: "#0ea5e9",
    points: [
      [52.1520, 11.6240],
      [52.1400, 11.6350],
      [52.1280, 11.6480],
      [52.1150, 11.6580],
      [52.1020, 11.6640],
    ],
  },
  {
    name: "Stadtpark Green Corridor",
    note: "Leafy path linking Glacis Park to Rotehorn — shaded and comfortable.",
    color: "#16a34a",
    points: [
      [52.1270, 11.6190],
      [52.1210, 11.6320],
      [52.1140, 11.6480],
      [52.1090, 11.6600],
    ],
  },
];

const EXPOSED_ZONES: ExposedZone[] = [
  {
    name: "Hauptbahnhof Area",
    note: "Main station zone — higher foot traffic, more exposed, less shaded.",
    center: [52.1302, 11.6270],
    radius: 240,
  },
  {
    name: "Sudenburg Junction",
    note: "Busier urban corridor with less tree cover. May feel warmer around midday.",
    center: [52.1145, 11.6130],
    radius: 200,
  },
];

// ── Component ──────────────────────────────────────────────────────────────

export default function EnvironmentMap() {
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

        // Fix Leaflet default icon path with bundlers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        if (!mapRef.current) return;

        map = L.map(mapRef.current, {
          center: [52.1280, 11.6360],
          zoom: 13,
          zoomControl: true,
          attributionControl: false,
        });

        // Light civic basemap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
        }).addTo(map);

        L.control.attribution({ prefix: "© OpenStreetMap" }).addTo(map);

        // ── Green zones (circles) ─────────────────────────────────────
        for (const zone of GREEN_ZONES) {
          L.circle(zone.center, {
            radius: zone.radius,
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.18,
            weight: 2,
            opacity: 0.7,
          })
            .bindPopup(
              `<div class="env-popup-content"><strong>${zone.name}</strong><p>${zone.note}</p></div>`,
              { maxWidth: 220, className: "env-popup" }
            )
            .bindTooltip(zone.name, { sticky: false, className: "env-tooltip" })
            .addTo(map);
        }

        // ── Cool corridors (polylines) ───────────────────────────────
        for (const corridor of COOL_CORRIDORS) {
          L.polyline(corridor.points, {
            color: corridor.color,
            weight: 4,
            opacity: 0.8,
            smoothFactor: 1.5,
          })
            .bindPopup(
              `<div class="env-popup-content"><strong>${corridor.name}</strong><p>${corridor.note}</p></div>`,
              { maxWidth: 220, className: "env-popup" }
            )
            .bindTooltip(corridor.name, { sticky: true, className: "env-tooltip" })
            .addTo(map);
        }

        // ── Exposed / warmer zones ────────────────────────────────────
        for (const zone of EXPOSED_ZONES) {
          const hotIcon = L.divIcon({
            className: "",
            html: `<div style="
              width: 36px; height: 36px; border-radius: 50%;
              background: rgba(251, 146, 60, 0.25);
              border: 2px solid #f97316;
              box-shadow: 0 0 10px rgba(249, 115, 22, 0.35);
              display: flex; align-items: center; justify-content: center;
              font-size: 15px; line-height: 1;
            ">🌡</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          L.marker(zone.center, { icon: hotIcon })
            .bindPopup(
              `<div class="env-popup-content"><strong>${zone.name}</strong><p>${zone.note}</p></div>`,
              { maxWidth: 220, className: "env-popup" }
            )
            .bindTooltip(zone.name, { sticky: false, className: "env-tooltip" })
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
  }, [mounted]);

  if (mapError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-green-50/40 rounded-xl border border-green-100">
        <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253" />
        </svg>
        <p className="text-sm font-semibold text-zinc-500">Map details are temporarily unavailable.</p>
        <p className="text-xs text-zinc-400">The environment summary is still available.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .env-tooltip {
          background: white;
          border: 1px solid #d1fae5;
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .env-tooltip::before { display: none; }
        .env-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          border: 1px solid #d1fae5;
          padding: 0;
        }
        .env-popup .leaflet-popup-content {
          margin: 0;
        }
        .env-popup-content {
          padding: 10px 14px;
        }
        .env-popup-content strong {
          font-size: 12px;
          font-weight: 800;
          color: #0a2540;
          display: block;
          margin-bottom: 4px;
        }
        .env-popup-content p {
          font-size: 11px;
          font-weight: 500;
          color: #52525b;
          margin: 0;
          line-height: 1.5;
          max-width: 200px;
        }
        .env-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
      <div
        ref={mapRef}
        className="w-full h-full rounded-xl overflow-hidden"
        style={{ minHeight: "300px" }}
      />
    </>
  );
}
