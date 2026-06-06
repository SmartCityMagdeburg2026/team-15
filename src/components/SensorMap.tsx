"use client";

import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

type Pin = {
  id: string;
  type: string;
  title: string;
  description?: string;
  metricLabel?: string;
  metricValue?: string;
  status?: string;
  statusColor?: string;
  metrics?: { label: string; value: string }[];
  lat?: number;
  lng?: number;
  color?: string;
};

export default function SensorMap({
  mapPins = [],
  mapFilters = {},
  selectedMapPin,
  setSelectedMapPin,
}: {
  mapPins?: Pin[];
  mapFilters?: Record<string, boolean>;
  selectedMapPin: Pin | null;
  setSelectedMapPin: (p: Pin | null) => void;
}) {
  const center: [number, number] = [52.1205, 11.6276];

  // Create a div icon for pins to avoid relying on image assets
  const makeIcon = (color = "#10b981") =>
    L.divIcon({
      className: "custom-pin",
      html: `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.12)"></span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

  const filteredPins = useMemo(() => {
    return mapPins.filter((p: any) => {
      // only show pins with coordinates
      if (typeof p.lat !== "number" || typeof p.lng !== "number") return false;
      // if filters provided, hide by type
      if (mapFilters && Object.keys(mapFilters).length > 0) {
        const allowed = (mapFilters as any)[p.type];
        if (typeof allowed === "boolean") return allowed;
      }
      return true;
    });
  }, [mapPins, mapFilters]);

  function FlyToSelected() {
    const map = useMap();
    useEffect(() => {
      if (selectedMapPin && selectedMapPin.lat && selectedMapPin.lng) {
        map.flyTo([selectedMapPin.lat, selectedMapPin.lng], 14, { duration: 0.6 });
      }
    }, [selectedMapPin, map]);
    return null;
  }

  return (
    <div className="w-full h-[640px] rounded-3xl overflow-hidden border border-zinc-100 shadow-xs">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filteredPins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.lat as number, pin.lng as number]}
            icon={makeIcon((pin as any).color ? (pin as any).color.replace("bg-", "#") : undefined)}
            eventHandlers={{
              click: () => {
                setSelectedMapPin(pin as Pin);
              },
            }}
          >
            <Popup>
              <div className="max-w-xs">
                <div className="font-black text-sm">{pin.title}</div>
                {pin.description && <div className="text-xs text-zinc-600 mt-1">{pin.description}</div>}
                <div className="mt-2 text-[12px]">
                  {pin.metrics ? (
                    <div className="grid grid-cols-2 gap-1">
                      {pin.metrics.slice(0, 4).map((m, i) => (
                        <div key={i} className="text-[12px]">
                          <div className="text-xs text-zinc-400 uppercase">{m.label}</div>
                          <div className="font-black">{m.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs text-zinc-400 uppercase">{pin.metricLabel}</div>
                      <div className="font-black">{pin.metricValue}</div>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <FlyToSelected />
      </MapContainer>
    </div>
  );
}
