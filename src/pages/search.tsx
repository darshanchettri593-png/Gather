import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { CalendarDays, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";

function getVibeLabel(vibe: string) {
  return vibe.charAt(0).toUpperCase() + vibe.slice(1);
}

function EventCard({ event }: { event: any }) {
  return (
    <Link
      to={`/event/${event.id}`}
      className="block active:opacity-90 transition-opacity"
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          backgroundColor: "#111110",
          borderRadius: "14px",
          overflow: "hidden",
          display: "flex",
          gap: "12px",
          padding: "12px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "10px",
            overflow: "hidden",
            flexShrink: 0,
            backgroundColor: "#242422",
          }}
        >
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#3D3D38" }}>
                {getVibeLabel(event.vibe || "").charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px", justifyContent: "center" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#FF6B35", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {getVibeLabel(event.vibe || "")}
          </span>
          <h3
            style={{
              fontSize: "15px", fontWeight: 600, color: "#F0EEE9", lineHeight: 1.3, margin: 0,
              overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}
          >
            {event.title}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <CalendarDays size={11} color="#6B6B63" strokeWidth={1.8} />
            <span style={{ fontSize: "13px", color: "#6B6B63" }}>
              {format(new Date(event.event_datetime), "MMM d, h:mm a")}
            </span>
          </div>
          {(event.district || event.location_text) && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <MapPin size={11} color="#6B6B63" strokeWidth={1.8} />
              <span style={{ fontSize: "13px", color: "#6B6B63", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {event.district || event.location_text}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        backgroundColor: "#1C1C1A",
        borderRadius: "14px",
        overflow: "hidden",
        display: "flex",
        gap: "12px",
        padding: "12px",
      }}
    >
      <div
        className="animate-pulse"
        style={{ width: "80px", height: "80px", borderRadius: "10px", backgroundColor: "#2A2A28", flexShrink: 0 }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
        <div className="animate-pulse" style={{ height: "10px", width: "35%", backgroundColor: "#2A2A28", borderRadius: "4px" }} />
        <div className="animate-pulse" style={{ height: "15px", width: "80%", backgroundColor: "#2A2A28", borderRadius: "4px" }} />
        <div className="animate-pulse" style={{ height: "12px", width: "55%", backgroundColor: "#2A2A28", borderRadius: "4px" }} />
      </div>
    </div>
  );
}

const VIBES = ['All', 'Move', 'Create', 'Hang', 'Learn', 'Explore'];

export function SearchPage() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedVibe, setSelectedVibe] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handler);
  }, [query]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["search-events-full", debouncedQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("event_datetime", new Date().toISOString())
        .or(
          `title.ilike.%${debouncedQuery}%,location_text.ilike.%${debouncedQuery}%,district.ilike.%${debouncedQuery}%`
        )
        .order("event_datetime", { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data || []).filter((r: any) => !!r.event_datetime);
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 0,
  });

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ["search-upcoming", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_events', {
        current_user_uuid: user?.id || null,
      });
      if (error) throw error;
      return (data || []).slice(0, 5);
    },
    staleTime: 60 * 1000,
  });

  const showEmpty = debouncedQuery.length >= 2 && !isLoading && results.length === 0;
  const showResults = debouncedQuery.length >= 2 && !isLoading && results.length > 0;
  const showLoading = debouncedQuery.length >= 2 && isLoading;

  const filteredResults = results.filter((e: any) => !selectedVibe || e.vibe === selectedVibe);
  const filteredUpcoming = upcomingEvents.filter((e: any) => !selectedVibe || e.vibe === selectedVibe);

  return (
    <div
      className="page-transition"
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#111110',
        overflow: 'hidden',
      }}
    >
      {/* ── Section 1: Fixed header ─────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, padding: '16px 16px 12px' }}>

        <h1 style={{
          color: '#F0EEE9',
          fontSize: '30px',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: '14px',
          letterSpacing: '-0.02em',
        }}>
          Find your next{' '}
          <span style={{ color: '#FF6B35' }}>gathering.</span>
        </h1>

        {/* Search bar */}
        <div style={{
          backgroundColor: '#1C1C1A',
          border: '1px solid #242422',
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#6B6B63" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="#6B6B63" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Events, places, areas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              document.documentElement.style.setProperty('overflow', 'hidden');
              document.body.style.overflow = 'hidden';
              document.body.style.position = 'fixed';
              document.body.style.width = '100%';
            }}
            onBlur={() => {
              document.documentElement.style.removeProperty('overflow');
              document.body.style.overflow = '';
              document.body.style.position = '';
              document.body.style.width = '';
            }}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F0EEE9',
              fontSize: '16px',
              WebkitTextFillColor: '#F0EEE9',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', color: '#6B6B63', fontSize: '16px', cursor: 'pointer', padding: 0 }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Vibe pills */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {VIBES.map((v) => (
            <button
              key={v}
              onClick={() => setSelectedVibe(v === 'All' ? '' : v.toLowerCase())}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                border: '1px solid #2A2A28',
                cursor: 'pointer',
                backgroundColor: (selectedVibe === v.toLowerCase() || (v === 'All' && !selectedVibe)) ? '#F0EEE9' : 'transparent',
                color: (selectedVibe === v.toLowerCase() || (v === 'All' && !selectedVibe)) ? '#111110' : '#6B6B63',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 2: Scrollable content ─────────────────────────────────────── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none',
        padding: '0 16px',
        paddingBottom: '100px',
      }}>

        {/* Loading skeletons */}
        {showLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px' }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* No results */}
        {showEmpty && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
            <p style={{ fontSize: '15px', color: '#6B6B63', textAlign: 'center' }}>
              No events found for '{debouncedQuery}'
            </p>
          </div>
        )}

        {/* Search results */}
        {showResults && (
          <>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#6B6B63', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '14px 0 10px' }}>
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredResults.map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}

        {/* Trending when no query */}
        {!query && (
          <>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#6B6B63', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '14px 0 10px' }}>
              Trending near you
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredUpcoming.length > 0 ? (
                filteredUpcoming.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <div style={{ position: 'relative', height: '230px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                  {/* Kalimpong map SVG — faded tribute */}
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.09 }} viewBox="0 0 300 230" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 180 Q30 160 60 170 Q90 180 120 165 Q150 150 180 160 Q210 170 240 155 Q270 140 300 150" stroke="#F0EEE9" strokeWidth="0.6" fill="none"/>
                    <path d="M0 200 Q40 185 70 195 Q100 205 130 188 Q160 172 190 182 Q220 192 260 175 Q280 165 300 170" stroke="#F0EEE9" strokeWidth="0.6" fill="none"/>
                    <path d="M0 215 Q50 205 90 212 Q120 218 150 205 Q180 192 210 200 Q250 210 300 198" stroke="#F0EEE9" strokeWidth="0.4" fill="none"/>
                    <path d="M0 230 Q20 210 30 195 Q40 178 25 160 Q15 145 10 125 Q5 108 20 95" stroke="#4A9EBF" strokeWidth="2" fill="none" opacity="0.6"/>
                    <path d="M0 230 Q22 212 32 198 Q43 180 28 162 Q18 147 13 127 Q8 110 23 97" stroke="#4A9EBF" strokeWidth="1" fill="none" opacity="0.3"/>
                    <path d="M15 230 Q25 210 40 195 Q55 178 70 165 Q90 148 115 140 Q140 132 165 125 Q190 118 220 115 Q250 112 280 108 Q290 106 300 105" stroke="#F0EEE9" strokeWidth="2" fill="none"/>
                    <text x="230" y="102" fill="#F0EEE9" fontSize="7" fontWeight="700" opacity="0.4" fontFamily="-apple-system,sans-serif">NH10</text>
                    <path d="M115 140 Q118 120 120 100 Q122 80 118 60" stroke="#F0EEE9" strokeWidth="1.2" fill="none"/>
                    <path d="M115 140 Q130 135 145 128 Q160 120 175 110 Q185 103 195 95" stroke="#F0EEE9" strokeWidth="1.5" fill="none"/>
                    <path d="M140 132 Q142 115 138 98 Q135 82 130 65" stroke="#F0EEE9" strokeWidth="1" fill="none"/>
                    <path d="M165 125 Q163 108 160 90 Q157 72 152 55" stroke="#F0EEE9" strokeWidth="1" fill="none"/>
                    <path d="M90 148 Q92 130 88 112 Q84 95 80 78" stroke="#F0EEE9" strokeWidth="1" fill="none"/>
                    <path d="M88 112 Q100 108 115 105 Q130 102 142 98" stroke="#F0EEE9" strokeWidth="0.8" fill="none"/>
                    <path d="M80 78 Q95 74 110 71 Q128 68 143 65 Q158 62 170 58" stroke="#F0EEE9" strokeWidth="0.8" fill="none"/>
                    <path d="M118 60 Q133 57 148 55 Q163 53 175 50" stroke="#F0EEE9" strokeWidth="0.6" fill="none"/>
                    <path d="M220 115 Q222 95 218 75 Q215 58 212 40" stroke="#F0EEE9" strokeWidth="1.2" fill="none"/>
                    <path d="M195 95 Q207 90 220 88 Q232 86 245 82" stroke="#F0EEE9" strokeWidth="0.8" fill="none"/>
                    <text x="215" y="72" fill="#FF6B35" fontSize="6" fontWeight="700" opacity="0.5" fontFamily="-apple-system,sans-serif">9th Mile</text>
                    <rect x="108" y="94" width="18" height="10" rx="2" fill="#F0EEE9" opacity="0.25"/>
                    <rect x="130" y="88" width="14" height="12" rx="2" fill="#F0EEE9" opacity="0.2"/>
                    <rect x="148" y="82" width="16" height="9" rx="2" fill="#F0EEE9" opacity="0.22"/>
                    <rect x="162" y="70" width="10" height="10" rx="2" fill="#F0EEE9" opacity="0.3"/>
                    <text x="158" y="67" fill="#F0EEE9" fontSize="5" opacity="0.3" fontFamily="-apple-system,sans-serif">Mangal Dham</text>
                    <rect x="82" y="100" width="12" height="8" rx="2" fill="#F0EEE9" opacity="0.25"/>
                    <text x="76" y="96" fill="#F0EEE9" fontSize="5" opacity="0.25" fontFamily="-apple-system,sans-serif">Motor Stand</text>
                    <text x="100" y="145" fill="#F0EEE9" fontSize="8" fontWeight="700" opacity="0.2" fontFamily="-apple-system,sans-serif">KALIMPONG</text>
                    <path d="M50 210 Q65 195 75 180 Q85 165 88 160" stroke="#F0EEE9" strokeWidth="0.8" fill="none"/>
                    <path d="M60 215 Q75 205 90 198" stroke="#F0EEE9" strokeWidth="0.8" fill="none"/>
                    <path d="M88 160 Q75 167 62 174 Q48 182 35 192" stroke="#F0EEE9" strokeWidth="0.7" fill="none"/>
                    <path d="M175 110 Q178 90 176 70 Q174 52 170 35" stroke="#F0EEE9" strokeWidth="1" fill="none"/>
                    <path d="M195 95 Q193 75 190 55 Q187 38 183 20" stroke="#F0EEE9" strokeWidth="0.8" fill="none"/>
                    <path d="M245 82 Q248 65 244 48 Q241 32 238 15" stroke="#F0EEE9" strokeWidth="0.8" fill="none"/>
                    <path d="M220 115 Q235 110 250 105 Q265 100 280 95" stroke="#F0EEE9" strokeWidth="0.7" fill="none"/>
                    <path d="M80 78 Q70 85 58 95 Q45 106 35 115" stroke="#F0EEE9" strokeWidth="0.7" fill="none"/>
                    <rect x="170" y="40" width="12" height="8" rx="2" fill="#F0EEE9" opacity="0.2"/>
                    <rect x="185" y="25" width="10" height="8" rx="2" fill="#F0EEE9" opacity="0.18"/>
                    <rect x="235" y="20" width="14" height="9" rx="2" fill="#F0EEE9" opacity="0.2"/>
                    <rect x="48" y="135" width="10" height="7" rx="2" fill="#F0EEE9" opacity="0.18"/>
                    <rect x="260" y="85" width="11" height="8" rx="2" fill="#F0EEE9" opacity="0.18"/>
                    <rect x="38" y="108" width="9" height="7" rx="2" fill="#F0EEE9" opacity="0.15"/>
                  </svg>

                  {/* Empty state content */}
                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '0 24px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(17,17,16,0.8)', border: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B6B63" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="10" y1="14" x2="8" y2="14"/><line x1="10" y1="18" x2="8" y2="18"/>
                      </svg>
                    </div>
                    <p style={{ color: '#6B6B63', fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>No gatherings near you yet.</p>
                  </div>

                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
