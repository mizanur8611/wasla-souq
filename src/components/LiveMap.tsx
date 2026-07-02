"use client";

// A small wrapper around react-leaflet so every screen that needs a pin (checkout address
// picker, customer order tracking, admin live rider list) shares one map implementation.
// Deliberately uses OpenStreetMap tiles via Leaflet instead of Google Maps — no API key
// needed, which matters since this project has no Maps billing account configured.
// Markers use emoji-in-a-div icons instead of Leaflet's default marker images, which
// otherwise need manual webpack asset config to not 404 in Next.js.

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ReactNode } from "react";

export interface MapPin {
  lat: number;
  lng: number;
  emoji: string;
  label?: string;
  color?: string;
  popupContent?: ReactNode;
}

function emojiIcon(emoji: string, color: string = "#0B2230") {
  return L.divIcon({
    html: `<div style="background:${color};width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);">
             <span style="transform:rotate(45deg);font-size:14px;">${emoji}</span>
           </div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 28],
  });
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LiveMap({
  pins,
  center,
  zoom = 13,
  height = 260,
  onMapClick,
  showLine = false,
}: {
  pins: MapPin[];
  center: [number, number];
  zoom?: number;
  height?: number;
  onMapClick?: (lat: number, lng: number) => void;
  showLine?: boolean;
}) {
  return (
    <div style={{ height, width: "100%", borderRadius: 16, overflow: "hidden" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick && <ClickHandler onClick={onMapClick} />}
        {showLine && pins.length >= 2 && (
          <Polyline positions={pins.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#11645B", weight: 3, dashArray: "6 6" }} />
        )}
        {pins.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]} icon={emojiIcon(p.emoji, p.color)}>
            {p.popupContent ? <Popup minWidth={200}>{p.popupContent}</Popup> : p.label && <Popup>{p.label}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
