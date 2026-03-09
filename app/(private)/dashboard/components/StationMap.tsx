"use client";

import { useEffect, useRef } from "react";

interface Props {
  latitude: number;
  longitude: number;
  stationName: string;
}

export default function StationMap({ latitude, longitude, stationName }: Props) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Se já existe instância, só recentra
    if (instanceRef.current) {
      instanceRef.current.setView([latitude, longitude], 15);
      return;
    }

    const init = async () => {
      const L = (await import("leaflet")).default;

      // Checagem extra: se o container já foi inicializado pelo Leaflet
      if ((mapRef.current as any)._leaflet_id) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center:          [latitude, longitude],
        zoom:            15,
        zoomControl:     true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const icon = L.divIcon({
        html: `
          <div style="
            width: 36px; height: 36px;
            background: #1a5c2e;
            border: 3px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px #1a5c2e44;
            position: relative;
          ">
            <div style="
              width: 10px; height: 10px;
              background: #ffffff;
              border-radius: 50%;
              position: absolute;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%) rotate(45deg);
            "></div>
          </div>
        `,
        className:   "",
        iconSize:    [36, 36],
        iconAnchor:  [18, 36],
        popupAnchor: [0, -40],
      });

      L.marker([latitude, longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px 0;">
            <div style="font-weight: 700; color: #0f1f12; margin-bottom: 4px;">${stationName}</div>
            <div style="color: #7aaa8a; font-size: 11px;">
              ${latitude.toFixed(5)}, ${longitude.toFixed(5)}
            </div>
          </div>
        `)
        .openPopup();

      instanceRef.current = map;
    };

    init();

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "100%", borderRadius: 12, overflow: "hidden", zIndex: 0 }}
    />
  );
}