import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { Search, ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

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
          backgroundColor: "#242422",
          borderRadius: "16px",
          overflow: "hidden",
          display: "flex",
          gap: "12px",
          padding: "12px",
          border: "1px solid #2A2A28",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "10px",
            overflow: "hidden",
            flexShrink: 0,
            backgroundColor: "#1C1C1A",
          }}
        >
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              referrerPolicy="no-referrer"
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
        backgroundColor: "#242422",
        borderRadius: "16px",
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

export function SearchPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

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
    queryKey: ["search-upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("event_datetime", new Date().toISOString())
        .order("event_datetime", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  const showEmpty = debouncedQuery.length >= 2 && !isLoading && results.length === 0;
  const showResults = debouncedQuery.length >= 2 && !isLoading && results.length > 0;
  const showLoading = debouncedQuery.length >= 2 && isLoading;
  const showPrompt = query.length < 2;

  return (
    <div
      className="page-transition max-w-md mx-auto min-h-screen flex flex-col"
      style={{ backgroundColor: "#111110", paddingBottom: "80px" }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          backgroundColor: "#111110",
          borderBottom: "1px solid #2A2A28",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="active:opacity-60 transition-opacity"
          style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={22} color="#F0EEE9" strokeWidth={2} />
        </button>
        <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: "17px", fontWeight: 600, color: "#F0EEE9" }}>
          Search
        </span>
        <div style={{ width: "40px" }} />
      </header>

      {/* Search input — sticky below header */}
      <div
        style={{
          position: "sticky",
          top: "56px",
          zIndex: 40,
          backgroundColor: "#111110",
          padding: "12px 16px",
          borderBottom: "1px solid #2A2A28",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#1C1C1A",
            border: "1px solid #2A2A28",
            borderRadius: "12px",
            padding: "12px 16px",
          }}
        >
          <Search size={16} color="#6B6B63" strokeWidth={2} style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events..."
            autoComplete="off"
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              fontSize: "15px",
              color: "#F0EEE9",
            }}
            className="placeholder:text-[#3D3D38]"
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>

        {/* Prompt / empty state */}
        {showPrompt && (
          <div style={{ padding: '32px 24px' }}>
            <p style={{ color: '#6B6B63', fontSize: '15px', textAlign: 'center', marginBottom: '32px' }}>
              Search for events by name, location or area.
            </p>

            <p style={{ color: '#F0EEE9', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Browse by Vibe
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
              {['Move 🏃', 'Create 🎨', 'Hang 🍻', 'Learn 📚', 'Explore 🗺️'].map((vibe) => (
                <button
                  key={vibe}
                  onClick={() => setQuery(vibe.split(' ')[0].toLowerCase())}
                  style={{
                    backgroundColor: '#242422',
                    border: '1px solid #2A2A28',
                    borderRadius: '999px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    color: '#F0EEE9',
                    cursor: 'pointer',
                  }}
                >
                  {vibe}
                </button>
              ))}
            </div>

            <p style={{ color: '#F0EEE9', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Upcoming Near You
            </p>
            {upcomingEvents.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {upcomingEvents.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading skeletons */}
        {showLoading && (
          <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* No results */}
        {showEmpty && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "80px" }}>
            <p style={{ fontSize: "15px", color: "#6B6B63", textAlign: "center" }}>
              No events found for '{debouncedQuery}'
            </p>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
            {results.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
