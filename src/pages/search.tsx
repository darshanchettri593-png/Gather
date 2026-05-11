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
                <p style={{ fontSize: '14px', color: '#6B6B63', textAlign: 'center', padding: '20px 0' }}>
                  No upcoming events{selectedVibe ? ` for ${selectedVibe}` : ''}.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
