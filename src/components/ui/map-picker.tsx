import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapPickerProps {
  mode: 'picker' | 'view';
  lat?: number;
  lng?: number;
  onLocationSelect?: (coords: { lat: number; lng: number }) => void;
}

export function MapPicker({ mode, lat, lng, onLocationSelect }: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locationMode, setLocationMode] = useState<'search' | 'gps' | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [pinSet, setPinSet] = useState(false);

  const DEFAULT_LAT = 26.7271;
  const DEFAULT_LNG = 88.3953;

  const gIcon = L.divIcon({
    className: '',
    html: `
      <div style="
        width: 36px;
        height: 44px;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          width: 36px;
          height: 36px;
          background: #FF6B35;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(255,107,53,0.5);
        ">
          <span style="
            transform: rotate(45deg);
            color: white;
            font-size: 16px;
            font-weight: 800;
            font-family: -apple-system, sans-serif;
            line-height: 1;
          ">G</span>
        </div>
        <div style="
          width: 2px;
          height: 8px;
          background: #FF6B35;
          margin-top: 0;
        "></div>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialLat = lat || DEFAULT_LAT;
    const initialLng = lng || DEFAULT_LNG;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CartoDB',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    if (mode === 'view' && lat && lng) {
      const marker = L.marker([lat, lng], { icon: gIcon }).addTo(map);
      markerRef.current = marker;
    }

    if (mode === 'picker') {
      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else {
          const marker = L.marker([clickLat, clickLng], { icon: gIcon, draggable: true }).addTo(map);
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onLocationSelect?.({ lat: pos.lat, lng: pos.lng });
          });
          markerRef.current = marker;
        }
        onLocationSelect?.({ lat: clickLat, lng: clickLng });
        setPinSet(true);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const handleGPS = () => {
    setGpsLoading(true);
    setLocationMode('gps');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: gpsLat, longitude: gpsLng } = pos.coords;
        const map = mapRef.current;
        if (!map) return;
        map.flyTo([gpsLat, gpsLng], 16);
        if (markerRef.current) {
          markerRef.current.setLatLng([gpsLat, gpsLng]);
        } else {
          const marker = L.marker([gpsLat, gpsLng], { icon: gIcon, draggable: true }).addTo(map);
          marker.on('dragend', () => {
            const p = marker.getLatLng();
            onLocationSelect?.({ lat: p.lat, lng: p.lng });
          });
          markerRef.current = marker;
        }
        onLocationSelect?.({ lat: gpsLat, lng: gpsLng });
        setPinSet(true);
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        alert('Could not get your location. Try searching instead.');
      }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=in`
      );
      const results = await res.json();
      if (results.length === 0) {
        alert('Location not found. Try a different search.');
        setSearching(false);
        return;
      }
      const { lat: searchLat, lon: searchLng } = results[0];
      const map = mapRef.current;
      if (!map) return;
      map.flyTo([parseFloat(searchLat), parseFloat(searchLng)], 16);
      if (markerRef.current) {
        markerRef.current.setLatLng([parseFloat(searchLat), parseFloat(searchLng)]);
      } else {
        const marker = L.marker([parseFloat(searchLat), parseFloat(searchLng)], { icon: gIcon, draggable: true }).addTo(map);
        marker.on('dragend', () => {
          const p = marker.getLatLng();
          onLocationSelect?.({ lat: p.lat, lng: p.lng });
        });
        markerRef.current = marker;
      }
      onLocationSelect?.({ lat: parseFloat(searchLat), lng: parseFloat(searchLng) });
      setPinSet(true);
    } catch {
      alert('Search failed. Try again.');
    }
    setSearching(false);
  };

  return (
    <div style={{ width: '100%' }}>
      {mode === 'picker' && (
        <>
          {/* Two option buttons */}
          {!locationMode && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={handleGPS}
                style={{
                  flex: 1,
                  backgroundColor: '#242422',
                  border: '1px solid #2A2A28',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#F0EEE9',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                📍 Use My Location
              </button>
              <button
                type="button"
                onClick={() => setLocationMode('search')}
                style={{
                  flex: 1,
                  backgroundColor: '#242422',
                  border: '1px solid #2A2A28',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#F0EEE9',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                🔍 Search Location
              </button>
            </div>
          )}

          {/* Search bar */}
          {locationMode === 'search' && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for a place..."
                style={{
                  flex: 1,
                  backgroundColor: '#1C1C1A',
                  border: '1px solid #2A2A28',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '15px',
                  color: '#F0EEE9',
                }}
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                style={{
                  backgroundColor: '#FF6B35',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {searching ? '...' : 'Go'}
              </button>
            </div>
          )}

          {gpsLoading && (
            <p style={{ fontSize: '13px', color: '#6B6B63', marginBottom: '8px', textAlign: 'center' }}>
              Getting your location...
            </p>
          )}
        </>
      )}

      {/* Map */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '220px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #2A2A28',
        }}
      />

      {mode === 'picker' && (
        <p style={{ fontSize: '13px', color: pinSet ? '#34C759' : '#6B6B63', marginTop: '8px', textAlign: 'center' }}>
          {pinSet ? '✓ Location pinned — drag to adjust' : 'Tap the map to drop a pin'}
        </p>
      )}

      {mode === 'view' && lat && lng && (
        <button
          onClick={() => window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')}
          style={{
            width: '100%',
            marginTop: '10px',
            backgroundColor: '#242422',
            border: '1px solid #2A2A28',
            borderRadius: '12px',
            padding: '12px',
            color: '#F0EEE9',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          📍 Get Directions
        </button>
      )}
    </div>
  );
}
