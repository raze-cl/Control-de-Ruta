"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // SVG Marker Pin to avoid Leaflet missing assets bug in Next.js
  const markerIcon = L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" class="w-8 h-8 filter drop-shadow-md">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center map on initial coordinates
    const initialCoords: L.LatLngTuple = (latitude === 0 && longitude === 0) 
        ? [-22.4542, -68.9294] // Default Calama (Zona de minas)
        : [latitude, longitude];

    // Create map
    const map = L.map(mapContainerRef.current).setView(initialCoords, 13);
    mapRef.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create marker
    const marker = L.marker(initialCoords, { icon: markerIcon }).addTo(map);
    markerRef.current = marker;

    // Listen to clicks on map to set coordinates
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onChange(parseFloat(lat.toFixed(6)), parseFloat(lng.toFixed(6)));
    });

    // Clean up
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker position if props change externally (e.g. from text inputs)
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      const currentLatLng = markerRef.current.getLatLng();
      if (currentLatLng.lat !== latitude || currentLatLng.lng !== longitude) {
        const newCoords: L.LatLngTuple = [latitude, longitude];
        markerRef.current.setLatLng(newCoords);
        mapRef.current.setView(newCoords, mapRef.current.getZoom());
      }
    }
  }, [latitude, longitude]);

  return (
    <div className="relative w-full h-[250px] rounded-lg overflow-hidden border border-slate-300">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 bg-white/95 px-2 py-1 rounded text-[10px] text-slate-500 font-medium pointer-events-none shadow-sm z-[1000] border border-slate-200">
        Haz clic en el mapa para ubicar el punto
      </div>
    </div>
  );
}
