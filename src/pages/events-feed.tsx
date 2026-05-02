import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { format } from "date-fns";
import { CalendarDays, AlertCircle, MapPin, Loader2 } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { LiveBadge } from "@/components/ui/live-badge";

const VIBES = ["All", "Move", "Create", "Hang", "Learn", "Explore"];

function getVibeLabel(vibe: string) {
  return vibe;
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Featured Card ────────────────────────────────────────────────────────────

function FeaturedEventCard({ event, userLocation }: { event: any; userLocation: { lat: number; lng: number } | null }) {
  const attendeeCount = event._count?.attendees || 0;
  const capacity = event.capacity || 0;
  const isFull = capacity > 0 && attendeeCount >= capacity;
  const spotsLeft = capacity > 0 ? capacity - attendeeCount : Infinity;
  const distance = userLocation && event.latitude && event.longitude
    ? getDistanceKm(userLocation.lat, userLocation.lng, event.latitude, event.longitude)
    : null;

  return (
    <Link
      to={`/event/${event.id}`}
      className="block active:opacity-90 transition-opacity"
    >
      <div
        style={{
          backgroundColor: "#1C1C1A",
          border: "1px solid #2A2A28",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <div className="relative w-full aspect-video overflow-hidden">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: "#242422" }}
            >
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#3D3D38",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Gather
              </span>
            </div>
          )}

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(17,17,16,0.9) 0%, transparent 60%)",
            }}
          />

          <div className="absolute bottom-0 left-0 p-[14px]" style={{ width: "100%" }}>
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className="inline-flex items-center"
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#FF6B35",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  backgroundColor: "rgba(255,107,53,0.15)",
                  border: "1px solid rgba(255,107,53,0.2)",
                  borderRadius: "999px",
                  padding: "3px 8px",
                }}
              >
                {getVibeLabel(event.vibe)}
              </div>
              {event.end_datetime && (
                <LiveBadge
                  eventDatetime={event.event_datetime}
                  endDatetime={event.end_datetime}
                  size="md"
                />
              )}
            </div>
            <h3
              className="line-clamp-2 mt-[6px]"
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#F0EEE9",
                lineHeight: 1.2,
                wordBreak: "break-word",
                overflowWrap: "break-word",
                width: "100%",
              }}
            >
              {event.title}
            </h3>
          </div>
        </div>

        <div
          style={{ padding: "12px 14px" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-[5px] shrink-0">
                <CalendarDays size={13} color="#6B6B63" strokeWidth={1.8} />
                <span style={{ fontSize: "13px", color: "#6B6B63" }}>
                  {format(new Date(event.event_datetime), "MMM d, h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-[5px] min-w-0">
                <MapPin size={13} color="#6B6B63" strokeWidth={1.8} className="shrink-0" />
                <span
                  style={{
                    fontSize: "13px",
                    color: "#6B6B63",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "120px",
                  }}
                >
                  {event.location_text}
                </span>
              </div>
            </div>
          {isFull ? (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#FF3B30",
                textTransform: "uppercase",
                backgroundColor: "rgba(255,59,48,0.15)",
                border: "1px solid rgba(255,59,48,0.3)",
                borderRadius: "999px",
                padding: "3px 8px",
                flexShrink: 0,
                marginLeft: "8px",
              }}
            >
              FULL
            </span>
          ) : spotsLeft !== Infinity && spotsLeft <= 5 ? (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#FF6B35",
                textTransform: "uppercase",
                backgroundColor: "rgba(255,107,53,0.15)",
                border: "1px solid rgba(255,107,53,0.3)",
                borderRadius: "999px",
                padding: "3px 8px",
                flexShrink: 0,
                marginLeft: "8px",
              }}
            >
              {spotsLeft} spots left
            </span>
          ) : (
            <span style={{ fontSize: "13px", color: "#6B6B63", flexShrink: 0, marginLeft: "8px" }}>
              {capacity > 0 ? `${attendeeCount}/${capacity} going` : `${attendeeCount} going`}
            </span>
          )}
          </div>
          {distance !== null && (
            <span style={{ fontSize: "12px", color: "#6B6B63", display: "block", marginTop: "4px" }}>
              {distance < 1 ? `${Math.round(distance * 1000)} m away` : `${distance.toFixed(1)} km away`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Compact Card ─────────────────────────────────────────────────────────────

function CompactEventCard({ event, userLocation }: { event: any; userLocation: { lat: number; lng: number } | null }) {
  const attendeeCount = event._count?.attendees || 0;
  const capacity = event.capacity || 0;
  const isFull = capacity > 0 && attendeeCount >= capacity;
  const spotsLeft = capacity > 0 ? capacity - attendeeCount : Infinity;
  const vibeInitial = event.vibe ? event.vibe.charAt(0).toUpperCase() : "G";
  const distance = userLocation && event.latitude && event.longitude
    ? getDistanceKm(userLocation.lat, userLocation.lng, event.latitude, event.longitude)
    : null;

  return (
    <Link
      to={`/event/${event.id}`}
      className="block active:opacity-90 transition-opacity"
    >
      <div
        className="flex gap-3"
        style={{
          backgroundColor: "#1C1C1A",
          border: "1px solid #2A2A28",
          borderRadius: "14px",
          padding: "12px",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
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
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span style={{ fontSize: "20px", fontWeight: 700, color: "#3D3D38" }}>
                {vibeInitial}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[4px] flex-1 min-w-0 justify-center">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#FF6B35",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {getVibeLabel(event.vibe)}
            </span>
            {event.end_datetime && (
              <LiveBadge
                eventDatetime={event.event_datetime}
                endDatetime={event.end_datetime}
                size="sm"
              />
            )}
          </div>
          <h3
            className="line-clamp-2"
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#F0EEE9",
              lineHeight: 1.3,
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {event.title}
          </h3>
          <span
            style={{
              fontSize: "12px",
              color: "#6B6B63",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {format(new Date(event.event_datetime), "MMM d")} · {event.location_text}
          </span>
          {distance !== null && (
            <span style={{ fontSize: "12px", color: "#6B6B63" }}>
              {distance < 1 ? `${Math.round(distance * 1000)} m away` : `${distance.toFixed(1)} km away`}
            </span>
          )}
          <span style={{ fontSize: "12px", color: isFull ? "#FF3B30" : spotsLeft !== Infinity && spotsLeft <= 5 ? "#FF6B35" : "#6B6B63" }}>
            {isFull
              ? "FULL"
              : spotsLeft !== Infinity && spotsLeft <= 5
              ? `${spotsLeft} spots left`
              : capacity > 0
              ? `${attendeeCount}/${capacity} going`
              : `${attendeeCount} going`}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function FeedEmptyState({ onHost }: { onHost: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-20">
      <CalendarDays size={40} color="#3D3D38" strokeWidth={1.5} />
      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#F0EEE9", marginTop: "16px" }}>
        Nothing here yet.
      </h3>
      <p style={{ fontSize: "14px", color: "#6B6B63", marginTop: "8px" }}>
        Be the one who starts something.
      </p>
      <button
        onClick={onHost}
        className="active:opacity-80 transition-opacity"
        style={{
          marginTop: "24px",
          backgroundColor: "#FF6B35",
          color: "white",
          fontSize: "15px",
          fontWeight: 600,
          height: "48px",
          borderRadius: "999px",
          padding: "0 28px",
        }}
      >
        Host a Gathering
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function EventFeedPage() {
  const navigate = useNavigate();
  const [vibeFilter, setVibeFilter] = useState<string>("All");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const { data: events, isLoading, error, refetch } = useEvents(vibeFilter);

  // 8-second timeout — show empty state instead of infinite skeleton
  const [isTimedOut, setIsTimedOut] = useState(false);
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setIsTimedOut(true), 8000);
      return () => clearTimeout(timer);
    } else {
      setIsTimedOut(false);
    }
  }, [isLoading]);

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [pullProgress, setPullProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) setTouchStartY(e.touches[0].clientY);
    else setTouchStartY(0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === 0) return;
    const diff = e.touches[0].clientY - touchStartY;
    if (diff > 0 && window.scrollY === 0) {
      e.stopPropagation();
      setPullProgress(Math.min(diff, 80));
    }
  };
  const handleTouchEnd = useCallback(async () => {
    if (pullProgress > 50) {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    }
    setPullProgress(0);
    setTouchStartY(0);
  }, [pullProgress, refetch]);

  useEffect(() => {
    if (isRefreshing) setPullProgress(50);
  }, [isRefreshing]);

  // ─── Render content ──────────────────────────────────────────────────────────

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <AlertCircle size={36} color="#3D3D38" strokeWidth={1.5} />
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#F0EEE9", marginTop: "16px" }}>
            Couldn't load events
          </h3>
          <p style={{ fontSize: "14px", color: "#6B6B63", marginTop: "6px" }}>
            Check your connection and try again.
          </p>
          <button
            onClick={() => refetch()}
            className="active:opacity-70 transition-opacity"
            style={{ marginTop: "20px", fontSize: "15px", fontWeight: 600, color: "#FF6B35" }}
          >
            Try again
          </button>
        </div>
      );
    }

    if (isLoading && !isTimedOut) {
      return (
        <div className="flex flex-col gap-[10px]" style={{ padding: "0 20px" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#1C1C1A",
                border: "1px solid #2A2A28",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              {i === 0 ? (
                <div
                  className="w-full aspect-video relative overflow-hidden"
                  style={{ backgroundColor: "#242422" }}
                >
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
                </div>
              ) : (
                <div className="flex gap-3" style={{ padding: "12px" }}>
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "10px",
                      backgroundColor: "#242422",
                      flexShrink: 0,
                    }}
                  />
                  <div className="flex flex-col gap-2 flex-1 justify-center">
                    <div style={{ height: "10px", width: "40%", backgroundColor: "#242422", borderRadius: "4px" }} />
                    <div style={{ height: "14px", width: "80%", backgroundColor: "#242422", borderRadius: "4px" }} />
                    <div style={{ height: "11px", width: "60%", backgroundColor: "#242422", borderRadius: "4px" }} />
                  </div>
                </div>
              )}
              {i === 0 && (
                <div className="flex gap-4" style={{ padding: "12px 14px" }}>
                  <div style={{ height: "12px", width: "35%", backgroundColor: "#242422", borderRadius: "4px" }} />
                  <div style={{ height: "12px", width: "30%", backgroundColor: "#242422", borderRadius: "4px" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (!events || events.length === 0) {
      return <FeedEmptyState onHost={() => navigate("/host")} />;
    }

    return (
      <div className="flex flex-col gap-[10px]" style={{ padding: "0 20px" }}>
        {events.map((event, index) =>
          index === 0 ? (
            <FeaturedEventCard key={event.id} event={event} userLocation={userLocation} />
          ) : (
            <CompactEventCard key={event.id} event={event} userLocation={userLocation} />
          )
        )}
      </div>
    );
  };

  // ─── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="page-transition flex flex-col pb-6"
      style={{ minHeight: "100%" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="flex justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullProgress > 0 ? `${pullProgress}px` : "0px" }}
      >
        <div className="flex items-end pb-2">
          <Loader2
            size={20}
            color="#3D3D38"
            className={pullProgress > 50 ? "animate-spin" : ""}
            style={{ transform: `rotate(${pullProgress * 3.6}deg)` }}
          />
        </div>
      </div>

      {/* Vibe pills */}
      <div
        className="flex gap-2 no-scrollbar overflow-x-auto"
        style={{ padding: "12px 20px" }}
      >
        {VIBES.map((v) => (
          <button
            key={v}
            onClick={() => setVibeFilter(v)}
            className="flex-shrink-0 transition-opacity active:opacity-70"
            style={{
              height: "32px",
              padding: "0 14px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: vibeFilter === v ? 600 : 400,
              backgroundColor: vibeFilter === v ? "#FF6B35" : "#1C1C1A",
              color: vibeFilter === v ? "white" : "#6B6B63",
              border: vibeFilter === v ? "none" : "1px solid #2A2A28",
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Section label */}
      <div style={{ padding: "0 20px 8px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "#6B6B63",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          UPCOMING GATHERINGS
        </span>
      </div>

      {renderContent()}
    </div>
  );
}
