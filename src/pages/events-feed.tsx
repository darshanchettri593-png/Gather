import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { format } from "date-fns";
import { CalendarRange, AlertCircle, MapPin, Loader2, Plus } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { EmptyState } from "@/pages/profile";

const VIBES = ["All", "Move", "Create", "Hang", "Learn", "Explore"];

// Fix 2: proper district/area names for the North Bengal region
const DISTRICTS = [
  "Siliguri", "Jalpaiguri", "Darjeeling",
  "Kalimpong", "Kurseong", "Alipurduar", "Cooch Behar"
];

const CITIES = [
  "Siliguri", "Kolkata", "Delhi", "Mumbai", "Bangalore",
  "Chennai", "Hyderabad", "Pune", "Darjeeling", "Jalpaiguri"
];

function getVibeLabel(vibe: string) {
  if (vibe === "All") return "All events";
  return vibe;
}

// Cinematic hero card — first event in feed
function FeaturedEventCard({ event }: { event: any }) {
  const attendeeCount = event._count?.attendees || 0;
  const activeDots = attendeeCount > 0 ? 3 : 0;

  return (
    <Link
      to={`/event/${event.id}`}
      className="group block active:scale-[0.98] transition-transform duration-100"
    >
      <div
        className="relative w-full overflow-hidden rounded-2xl cursor-pointer"
        style={{
          aspectRatio: "16/10",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Cover image */}
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 bg-[#242422] flex items-center justify-center">
            <span className="text-[28px] font-bold text-[#FF6B35]/20 uppercase tracking-widest">
              Gather
            </span>
          </div>
        )}

        {/* Cinematic gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, #0F0F0E 0%, rgba(15,15,14,0.4) 40%, transparent 100%)",
          }}
        />

        {/* TOP LEFT badges */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-white font-bold uppercase tracking-wider shadow-lg"
            style={{ fontSize: "12px", backgroundColor: "#FF6B35" }}
          >
            {getVibeLabel(event.vibe)}
          </span>
          <span
            className="px-3 py-1 rounded-full font-bold uppercase tracking-wider"
            style={{
              fontSize: "12px",
              backgroundColor: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            Featured
          </span>
        </div>

        {/* BOTTOM CONTENT */}
        <div className="absolute bottom-0 left-0 w-full p-8">
          <p
            className="font-semibold mb-2"
            style={{ fontSize: "14px", color: "#FF6B35" }}
          >
            {format(new Date(event.event_datetime), "EEEE, MMM d").toUpperCase()} •{" "}
            {format(new Date(event.event_datetime), "h:mm a")}
          </p>

          <h3
            className="font-bold text-white leading-[1.05] mb-4 line-clamp-2"
            style={{ fontSize: "32px", letterSpacing: "-0.03em" }}
          >
            {event.title}
          </h3>

          <div className="flex items-center justify-between">
            {/* Attendee avatars */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[...Array(Math.max(0, Math.min(attendeeCount, 5)))].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-[#2A2A28] flex items-center justify-center text-[10px] font-bold text-[#9A9A8E]"
                    style={{ border: "2px solid #1C1C1A", zIndex: 5 - i }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                {attendeeCount === 0 && (
                  <div
                    className="w-8 h-8 rounded-full bg-[#2A2A28]"
                    style={{ border: "2px solid #1C1C1A" }}
                  />
                )}
              </div>
              <span style={{ fontSize: "12px", color: "#9A9A8E" }}>
                {attendeeCount} going
              </span>
            </div>

            {/* Gathering pulse dots */}
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: "6px",
                    height: "6px",
                    backgroundColor: i < activeDots ? "#FF6B35" : "#2E2E2C",
                    boxShadow: i < activeDots ? "0 0 8px rgba(255,107,53,0.6)" : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Vertical card with image + date badge
function CompactEventCard({ event }: { event: any }) {
  const eventDate = new Date(event.event_datetime);
  const dayNum = format(eventDate, "d");
  const monthStr = format(eventDate, "MMM").toUpperCase();

  return (
    <Link
      to={`/event/${event.id}`}
      className="group block active:scale-[0.98] transition-transform duration-100"
    >
      <div className="glass-card rounded-xl overflow-hidden flex flex-col transition-all duration-300 group-hover:-translate-y-1">
        {/* Image area */}
        <div className="relative h-48 overflow-hidden bg-[#242422]">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[22px] font-bold text-[#FF6B35]/20 uppercase tracking-widest">
                Gather
              </span>
            </div>
          )}

          {/* Date badge */}
          <div
            className="absolute top-3 right-3 rounded-lg p-2 text-center"
            style={{
              backgroundColor: "rgba(0,0,0,0.40)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.10)",
              minWidth: "44px",
            }}
          >
            <div className="font-bold text-white" style={{ fontSize: "18px", lineHeight: 1 }}>
              {dayNum}
            </div>
            <div style={{ fontSize: "10px", color: "#d6d3d1", textTransform: "uppercase" }}>
              {monthStr}
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-1">
            <span
              className="rounded font-bold uppercase tracking-wider"
              style={{
                padding: "2px 8px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "#9A9A8E",
                fontSize: "10px",
              }}
            >
              {getVibeLabel(event.vibe)}
            </span>
            <span style={{ fontSize: "10px", color: "#5A5A52" }}>
              {event._count?.attendees || 0} going
            </span>
          </div>

          <h3
            className="font-semibold line-clamp-1 mb-4 mt-1"
            style={{ fontSize: "20px", color: "#E5E2DE" }}
          >
            {event.title}
          </h3>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3 h-3 shrink-0" style={{ color: "#9A9A8E" }} />
              <span
                className="truncate"
                style={{ fontSize: "12px", color: "#9A9A8E", maxWidth: "160px" }}
              >
                {event.location_text}
              </span>
            </div>

            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <Plus className="w-4 h-4" style={{ color: "#FF6B35" }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function EventFeedPage() {
  const navigate = useNavigate();
  const [vibeFilter, setVibeFilter] = useState<string>("All");

  // Fix 3: Ensure Siliguri is written to localStorage on first load
  const [city, setCity] = useState<string>(() => {
    const stored = localStorage.getItem("gather_city");
    if (!stored) {
      localStorage.setItem("gather_city", "Siliguri");
      return "Siliguri";
    }
    return stored;
  });

  const [districtFilter, setDistrictFilter] = useState<string>("All");
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  // Fix 1: Listen for header city tap event
  useEffect(() => {
    const openModal = () => setIsCityModalOpen(true);
    window.addEventListener("gather:open-city-picker", openModal);
    return () => window.removeEventListener("gather:open-city-picker", openModal);
  }, []);

  const { data: events, isLoading, error, refetch } = useEvents(vibeFilter, city, districtFilter);

  // Fix 4: 10-second loading timeout — show empty state instead of forever skeleton
  const [isTimedOut, setIsTimedOut] = useState(false);
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setIsTimedOut(true), 10000);
      return () => clearTimeout(timer);
    } else {
      setIsTimedOut(false);
    }
  }, [isLoading]);

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
      setPullProgress(Math.min(diff, 100));
    }
  };

  const handleTouchEnd = useCallback(async () => {
    if (pullProgress > 60) {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    }
    setPullProgress(0);
    setTouchStartY(0);
  }, [pullProgress, refetch]);

  useEffect(() => {
    if (isRefreshing) setPullProgress(60);
  }, [isRefreshing]);

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    localStorage.setItem("gather_city", selectedCity);
    window.dispatchEvent(new Event("storage"));
    setIsCityModalOpen(false);
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <AlertCircle className="h-10 w-10 text-[#5A5A52] mb-3" strokeWidth={1.5} />
          <h3 className="text-[17px] font-semibold text-[#E5E2DE] mb-1.5">
            Couldn't load events
          </h3>
          <p className="text-[13px] text-[#9A9A8E] max-w-[280px]">
            Something went wrong on our end. Try again in a sec.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-6 py-2 rounded-full border border-[#2E2E2C] text-[#E5E2DE] font-medium active:bg-[#2A2A28] transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    // Fix 4: show skeleton only while loading AND not timed out
    if (isLoading && !isTimedOut) {
      return (
        <div className="flex flex-col gap-[12px] px-[16px]">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden bg-[#242422]"
              style={{ border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div
                className="w-full bg-[#2A2A28] relative overflow-hidden"
                style={{ aspectRatio: "16/10" }}
              >
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              </div>
              <div className="p-5 flex flex-col gap-3">
                <div className="h-[20px] w-[70%] bg-[#2A2A28] rounded-md relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>
                <div className="h-[14px] w-[40%] bg-[#2A2A28] rounded-md relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!events || events.length === 0) {
      return (
        <div className="mt-[40px]">
          <EmptyState
            icon={CalendarRange}
            heading="Nothing here yet."
            subtext="Be the one who starts something."
            buttonText="Host a Gathering"
            onAction={() => navigate("/host")}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-[14px] px-[16px]">
        {events.map((event, index) => {
          if (index === 0) return <FeaturedEventCard key={event.id} event={event} />;
          return <CompactEventCard key={event.id} event={event} />;
        })}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="page-transition pb-6 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Fix 1: Only district pills here — city is in the header */}
      {/* Fix 2: District pills with correct area names */}
      <div className="sticky top-[64px] z-40 bg-[#131312] pt-[10px] pb-[6px]">
        <div className="flex gap-[12px] overflow-x-auto no-scrollbar px-[16px] pb-[4px]">
          <button
            onClick={() => setDistrictFilter("All")}
            className={`flex-shrink-0 px-6 py-2 text-[14px] font-semibold rounded-full transition-all active:scale-95 ${
              districtFilter === "All" ? "bg-[#FF6B35] text-white" : "text-[#9A9A8E]"
            }`}
            style={
              districtFilter !== "All"
                ? { backgroundColor: "#2A2A28", border: "1px solid rgba(255,255,255,0.05)" }
                : {}
            }
          >
            All
          </button>
          {DISTRICTS.map((d) => (
            <button
              key={d}
              onClick={() => setDistrictFilter(d)}
              className={`flex-shrink-0 px-6 py-2 text-[14px] font-semibold rounded-full transition-all active:scale-95 ${
                districtFilter === d ? "bg-[#FF6B35] text-white" : "text-[#9A9A8E]"
              }`}
              style={
                districtFilter !== d
                  ? { backgroundColor: "#2A2A28", border: "1px solid rgba(255,255,255,0.05)" }
                  : {}
              }
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Pull to refresh */}
      <div
        className="flex justify-center transition-all duration-200 overflow-hidden"
        style={{ height: pullProgress > 0 ? `${pullProgress}px` : "0px" }}
      >
        <div className="flex items-end pb-2">
          <Loader2
            className={`h-6 w-6 text-[#5A5A52] ${pullProgress > 60 ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${pullProgress * 3}deg)` }}
          />
        </div>
      </div>

      {/* Fix 2: Section header ABOVE vibe pills */}
      <div className="flex items-center justify-between px-[24px] pt-[16px] pb-[12px]">
        <h2 className="font-semibold text-[#E5E2DE]" style={{ fontSize: "24px" }}>
          Nearby Gatherings
        </h2>
        <span className="font-semibold" style={{ fontSize: "14px", color: "#FF6B35" }}>
          View all →
        </span>
      </div>

      {/* Vibe pills — BELOW the section title */}
      <div className="flex gap-[12px] overflow-x-auto no-scrollbar px-[16px] mb-[16px] pb-2">
        {VIBES.map((v) => (
          <button
            key={v}
            onClick={() => setVibeFilter(v)}
            className={`flex-shrink-0 px-6 py-2 text-[14px] font-semibold rounded-full transition-all active:scale-95 ${
              vibeFilter === v ? "bg-[#FF6B35] text-white" : "text-[#9A9A8E]"
            }`}
            style={
              vibeFilter !== v
                ? { backgroundColor: "#2A2A28", border: "1px solid rgba(255,255,255,0.05)" }
                : {}
            }
          >
            {v}
          </button>
        ))}
      </div>

      {renderContent()}

      {/* City Picker Modal */}
      {isCityModalOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCityModalOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[101] bg-[#242422] rounded-t-3xl flex flex-col max-h-[85vh]">
            <div className="flex justify-center pt-[10px] pb-[10px]">
              <div className="w-[40px] h-[4px] rounded-full" style={{ backgroundColor: "#383836" }} />
            </div>
            <div className="px-[20px] pb-[16px]">
              <h3 className="text-[17px] font-semibold text-[#E5E2DE]">Choose your city</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-[20px] pb-[env(safe-area-inset-bottom,20px)]">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => handleCitySelect(c)}
                  className="w-full flex items-center justify-between h-[52px] border-b border-[#2E2E2C] last:border-0 active:opacity-70 transition-opacity"
                >
                  <span className={`text-[16px] font-medium ${city === c ? "text-[#FF6B35]" : "text-[#E5E2DE]"}`}>
                    {c}
                  </span>
                  {city === c && <div className="w-2 h-2 rounded-full bg-[#FF6B35]" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
