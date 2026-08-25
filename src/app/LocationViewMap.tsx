"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationViewMapProps {
  latitude: number;
  longitude: number;
  pointCodigo: string;
}

export default function LocationViewMap({
  latitude,
  longitude,
  pointCodigo,
}: LocationViewMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // SVG Marker Pin to avoid Leaflet missing assets bug in Next.js
  const markerIcon = L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EF4444" class="w-8 h-8 filter drop-shadow-md">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const coords: L.LatLngTuple = [latitude, longitude];

    // Create map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
    }).setView(coords, 14);
    mapRef.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create marker with popup
    L.marker(coords, { icon: markerIcon })
      .addTo(map)
      .bindPopup(`<b>Punto: ${pointCodigo}</b><br/>Lat: ${latitude}<br/>Lng: ${longitude}`)
      .openPopup();

    // Clean up
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, pointCodigo]);

  return (
    <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
