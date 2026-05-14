import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface OlaResult {
  display_name: string;
  lat?: number;
  lon?: number;
  place_id?: string;
}

export function MapPicker({ mode, lat, lng, onLocationSelect }: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OlaResult[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
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
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '',
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

  const placeMarker = (placeLat: number, placeLng: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo([placeLat, placeLng], 16);
    if (markerRef.current) {
      markerRef.current.setLatLng([placeLat, placeLng]);
    } else {
      const marker = L.marker([placeLat, placeLng], { icon: gIcon, draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        onLocationSelect?.({ lat: p.lat, lng: p.lng });
      });
      markerRef.current = marker;
    }
    onLocationSelect?.({ lat: placeLat, lng: placeLng });
    setPinSet(true);
  };

  const handleGPS = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        placeMarker(pos.coords.latitude, pos.coords.longitude);
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        alert('Could not get your location. Try searching instead.');
      }
    );
  };

  const searchPlaces = async (query: string) => {
    if (!query || query.length < 3) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query)}&location=27.0660,88.4757&radius=50000&api_key=${import.meta.env.VITE_OLA_MAPS_KEY}`
      );
      const data = await response.json();
      if (data.predictions) {
        setSearchResults(data.predictions.map((p: any) => ({
          display_name: p.description,
          lat: p.geometry?.location?.lat,
          lon: p.geometry?.location?.lng,
          place_id: p.place_id,
        })));
      }
    } catch (err) {
      console.error('OLA Maps search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const getPlaceDetails = async (place_id: string) => {
    const response = await fetch(
      `https://api.olamaps.io/places/v1/details?place_id=${place_id}&api_key=${import.meta.env.VITE_OLA_MAPS_KEY}`
    );
    const data = await response.json();
    return {
      lat: data.result?.geometry?.location?.lat,
      lon: data.result?.geometry?.location?.lng,
      display_name: data.result?.formatted_address,
    };
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSearchResults([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) return;

    debounceRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 300);
  };

  const handleResultSelect = async (result: OlaResult) => {
    let placeLat = result.lat;
    let placeLng = result.lon;

    if ((!placeLat || !placeLng) && result.place_id) {
      try {
        const details = await getPlaceDetails(result.place_id);
        placeLat = details.lat;
        placeLng = details.lon;
        if (details.display_name) {
          setSearchQuery(details.display_name);
        }
      } catch {
        // silently fail
      }
    } else {
      setSearchQuery(result.display_name);
    }

    if (placeLat && placeLng) {
      placeMarker(placeLat, placeLng);
    }
    setSearchResults([]);
  };

  return (
    <div style={{ width: '100%' }}>
      {mode === 'picker' && (
        <>
          {/* Search bar with dropdown */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search a place or address..."
              style={{
                width: '100%',
                backgroundColor: '#1C1C1A',
                border: '1px solid #2A2A28',
                borderRadius: '10px',
                padding: '10px 14px',
                color: '#F0EEE9',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {isSearching && (
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#6B6B63' }}>
                …
              </div>
            )}
            {searchResults.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  backgroundColor: '#1C1C1A',
                  border: '1px solid #2A2A28',
                  borderRadius: '10px',
                  marginTop: '4px',
                  overflow: 'hidden',
                }}
              >
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    type="button"
                    onPointerDown={() => handleResultSelect(result)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: i < searchResults.length - 1 ? '1px solid #2A2A28' : 'none',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      lineHeight: 1.4,
                    }}
                  >
                    <div style={{ color: '#F0EEE9', fontSize: '13px', fontWeight: 500 }}>
                      {result.display_name.split(',')[0]}
                    </div>
                    <div style={{ color: '#6B6B63', fontSize: '11px', marginTop: '2px' }}>
                      {result.display_name.split(',').slice(1, 3).join(',').trim()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GPS button */}
          <button
            type="button"
            onClick={handleGPS}
            disabled={gpsLoading}
            style={{
              width: '100%',
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
              marginBottom: '10px',
            }}
          >
            {gpsLoading ? 'Getting location...' : '📍 Use My Location'}
          </button>
        </>
      )}

      {/* Map */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '220px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />

      {/* Attribution */}
      <div style={{ fontSize: '10px', color: '#3D3D38', textAlign: 'right', padding: '4px 8px' }}>
        <a href="https://openstreetmap.org/copyright" target="_blank" style={{ color: '#3D3D38' }}>
          Ola Maps
        </a>
      </div>

      {mode === 'picker' && (
        <p style={{ fontSize: '13px', color: pinSet ? '#34C759' : '#6B6B63', marginTop: '4px', textAlign: 'center' }}>
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
