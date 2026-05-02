import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

import { useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

interface MapPickerProps {
  mode: 'picker' | 'view';
  lat?: number;
  lng?: number;
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
}

const DEFAULT_CENTER: [number, number] = [26.7271, 88.3953];
const DEFAULT_ZOOM = 13;

function DraggableMarker({
  initialPosition,
  onDragEnd,
}: {
  initialPosition: [number, number];
  onDragEnd: (coords: { lat: number; lng: number }) => void;
}) {
  const [position, setPosition] = useState<[number, number]>(initialPosition);
  const markerRef = useRef<L.Marker>(null);

  return (
    <Marker
      draggable
      position={position}
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker) {
            const { lat, lng } = marker.getLatLng();
            setPosition([lat, lng]);
            onDragEnd({ lat, lng });
          }
        },
      }}
    />
  );
}

export function MapPicker({ mode, lat, lng, onLocationSelect }: MapPickerProps) {
  const center: [number, number] = lat != null && lng != null ? [lat, lng] : DEFAULT_CENTER;

  return (
    <div>
      <div style={{ borderRadius: '16px', overflow: 'hidden', height: '200px' }}>
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          style={{ height: '200px', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {mode === 'picker' ? (
            <DraggableMarker
              initialPosition={center}
              onDragEnd={(coords) => onLocationSelect?.(coords)}
            />
          ) : (
            <Marker position={center} />
          )}
        </MapContainer>
      </div>

      {mode === 'picker' && (
        <p style={{ fontSize: '13px', color: '#6B6B63', marginTop: '8px', textAlign: 'center' }}>
          Drag the pin to your exact event location
        </p>
      )}

      {mode === 'view' && lat != null && lng != null && (
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            marginTop: '10px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 600,
            color: '#FF6B35',
            textDecoration: 'none',
          }}
        >
          📍 Get Directions
        </a>
      )}
    </div>
  );
}
