'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TripMapProps {
  center: [number, number];
  zoom: number;
  destination: string;
  latitude: number | null;
  longitude: number | null;
  liveLoc: { lat: number; lng: number } | null;
}

export default function TripMap({ center, zoom, destination, latitude, longitude, liveLoc }: TripMapProps) {
  // Define icons using Leaflet directly since Leaflet is fully loaded on client here
  const customIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  const liveIcon = new L.DivIcon({
    className: 'live-marker',
    html: '<div class="w-6 h-6 bg-violet-600 rounded-full border-4 border-white shadow-[0_0_10px_rgba(124,58,237,0.5)] animate-pulse"></div>',
    iconSize: [24, 24]
  });

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {latitude && longitude && !liveLoc && (
        <Marker position={[latitude, longitude]} icon={customIcon}>
          <Popup>
            <div className="text-slate-900 font-bold">{destination}</div>
          </Popup>
        </Marker>
      )}
      {liveLoc && (
        <Marker position={[liveLoc.lat, liveLoc.lng]} icon={liveIcon}>
          <Popup>
            <div className="text-slate-900 font-black">Vehicle Live Location</div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
