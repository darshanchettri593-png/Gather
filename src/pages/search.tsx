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
                <div style={{ position: 'relative', height: '380px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} viewBox="0 0 260 280" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 300 Q10 270 8 240 Q6 210 15 180 Q24 150 18 120 Q12 90 22 60 Q28 40 20 10" stroke="#4A9EBF" strokeWidth="5" fill="none" opacity="0.7"/>
                    <path d="M5 300 Q15 272 13 242 Q11 212 20 182 Q29 152 23 122 Q17 92 27 62 Q33 42 25 12" stroke="#4A9EBF" strokeWidth="2.5" fill="none" opacity="0.3"/>
                    <path d="M0 300 Q15 275 28 255 Q42 233 58 215 Q76 196 98 182 Q122 167 148 158 Q174 149 202 144 Q230 139 258 136 Q278 134 300 132" stroke="#F0EEE9" strokeWidth="3" fill="none"/>
                    <text x="240" y="128" fill="#F0EEE9" fontSize="8" fontWeight="700" opacity="0.5" fontFamily="-apple-system,sans-serif">NH10</text>
                    <path d="M98 182 Q110 170 124 158 Q138 146 152 134 Q166 122 178 110 Q190 98 200 86" stroke="#F0EEE9" strokeWidth="2.5" fill="none"/>
                    <path d="M124 158 Q126 138 128 118 Q130 98 126 78 Q122 58 118 38" stroke="#F0EEE9" strokeWidth="1.8" fill="none"/>
                    <path d="M148 158 Q150 136 147 114 Q144 92 140 70 Q136 50 132 28" stroke="#F0EEE9" strokeWidth="1.5" fill="none"/>
                    <path d="M178 148 Q176 126 173 104 Q170 82 166 60 Q162 40 158 18" stroke="#F0EEE9" strokeWidth="1.5" fill="none"/>
                    <path d="M78 200 Q80 178 77 156 Q74 134 70 112 Q66 90 62 68" stroke="#F0EEE9" strokeWidth="1.5" fill="none"/>
                    <path d="M70 156 Q84 152 98 148 Q112 144 126 140 Q140 136 152 132" stroke="#F0EEE9" strokeWidth="1" fill="none"/>
                    <path d="M62 112 Q78 108 94 104 Q112 100 130 96 Q148 92 164 88 Q178 84 192 80" stroke="#F0EEE9" strokeWidth="1" fill="none"/>
                    <path d="M118 56 Q134 52 150 49 Q166 46 180 43 Q194 40 208 37" stroke="#F0EEE9" strokeWidth="0.8" fill="none"/>
                    <path d="M202 144 Q204 120 200 96 Q197 74 194 50 Q191 28 188 8" stroke="#F0EEE9" strokeWidth="1.8" fill="none"/>
                    <path d="M202 144 Q218 140 234 136 Q250 132 268 128 Q284 124 300 122" stroke="#F0EEE9" strokeWidth="1.2" fill="none"/>
                    <text x="196" y="78" fill="#FF6B35" fontSize="7" fontWeight="700" opacity="0.6" fontFamily="-apple-system,sans-serif">9th Mile</text>
                    <path d="M58 215 Q50 230 42 245 Q34 260 28 275" stroke="#F0EEE9" strokeWidth="1" fill="none"/>
                    <path d="M78 200 Q66 208 54 216 Q42 224 30 234" stroke="#F0EEE9" strokeWidth="0.8" fill="none"/>
                    <path d="M200 86 Q210 76 220 64 Q232 50 240 36 Q248 22 252 8" stroke="#F0EEE9" strokeWidth="1.2" fill="none"/>
                    <path d="M234 136 Q236 114 232 92 Q229 72 226 50" stroke="#F0EEE9" strokeWidth="1" fill="none"/>
                    <path d="M192 80 Q204 76 218 72 Q232 68 246 64" stroke="#F0EEE9" strokeWidth="0.8" fill="none"/>
                    <rect x="114" y="136" width="22" height="14" rx="2" fill="#F0EEE9" opacity="0.28"/>
                    <rect x="140" y="126" width="18" height="13" rx="2" fill="#F0EEE9" opacity="0.24"/>
                    <rect x="160" y="116" width="20" height="12" rx="2" fill="#F0EEE9" opacity="0.26"/>
                    <rect x="102" y="148" width="14" height="10" rx="2" fill="#F0EEE9" opacity="0.22"/>
                    <rect x="132" y="112" width="16" height="11" rx="2" fill="#F0EEE9" opacity="0.2"/>
                    <rect x="68" y="148" width="16" height="10" rx="2" fill="#F0EEE9" opacity="0.25"/>
                    <text x="58" y="144" fill="#F0EEE9" fontSize="6" opacity="0.3" fontFamily="-apple-system,sans-serif">Motor Stand</text>
                    <rect x="172" y="96" width="14" height="12" rx="2" fill="#F0EEE9" opacity="0.3"/>
                    <text x="162" y="92" fill="#F0EEE9" fontSize="6" opacity="0.32" fontFamily="-apple-system,sans-serif">Mangal Dham</text>
                    <rect x="118" y="64" width="14" height="10" rx="2" fill="#F0EEE9" opacity="0.2"/>
                    <rect x="138" y="56" width="12" height="9" rx="2" fill="#F0EEE9" opacity="0.18"/>
                    <rect x="162" y="48" width="14" height="9" rx="2" fill="#F0EEE9" opacity="0.2"/>
                    <rect x="188" y="40" width="12" height="9" rx="2" fill="#F0EEE9" opacity="0.22"/>
                    <rect x="222" y="52" width="14" height="10" rx="2" fill="#F0EEE9" opacity="0.18"/>
                    <rect x="238" y="38" width="10" height="8" rx="2" fill="#F0EEE9" opacity="0.16"/>
                    <text x="88" y="196" fill="#F0EEE9" fontSize="9" fontWeight="700" opacity="0.15" fontFamily="-apple-system,sans-serif">KALIMPONG</text>
                  </svg>

                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '0 24px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(17,17,16,0.85)', border: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
