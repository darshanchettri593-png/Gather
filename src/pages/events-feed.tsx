import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { format } from "date-fns";
import { CalendarRange, AlertCircle, MapPin, Loader2 } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { EmptyState } from "@/pages/profile";

const VIBES = ["All", "Move", "Create", "Hang", "Learn", "Explore"];

function getVibeLabel(vibe: string) {
  if (vibe === "All") return "All events";
  return vibe;
}

export function EventFeedPage() {
  const navigate = useNavigate();
  const [vibeFilter, setVibeFilter] = useState<string>("All");

  // Don't filter by location — all Gather events are in Siliguri.
  // Location text is descriptive (e.g. "Coffee House, Pradhan Nagar")
  // and may not contain "Siliguri", so filtering would hide valid events.
  const { data: events, isLoading, error, refetch } = useEvents(vibeFilter);

  console.log('[Feed] state:', { 
    isLoading, 
    error, 
    eventsCount: events?.length ?? 'null',
    activeVibe: vibeFilter 
  });

  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [pullProgress, setPullProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStartY(e.touches[0].clientY);
    } else {
      setTouchStartY(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    
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
    if (isRefreshing) {
      setPullProgress(60);
    }
  }, [isRefreshing]);

  const getEmptySubtext = (vibe: string) => {
    switch (vibe) {
      case "Move": return "No Move events yet. Host a run, gym session, or yoga class.";
      case "Create": return "No Create events yet. Host a jam, art session, or craft meet.";
      case "Hang": return "No Hang events yet. Host a dinner, game night, or casual meet.";
      case "Learn": return "No Learn events yet. Host a workshop, book club, or talk.";
      case "Explore": return "No Explore events yet. Host a trip, food tour, or adventure.";
      default: return "Be the first to host something in Siliguri.";
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <AlertCircle className="h-10 w-10 text-neutral-300 mb-3" strokeWidth={1.5} />
          <h3 className="text-[17px] font-semibold text-neutral-900 mb-1.5">Couldn't load events</h3>
          <p className="text-[13px] text-neutral-500 max-w-[280px]">
            Something went wrong on our end. Try again in a sec.
          </p>
          <button 
            onClick={() => refetch()}
            className="mt-4 px-6 py-2 rounded-full border border-neutral-300 text-neutral-700 font-medium active:bg-neutral-50 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white">
              <div className="aspect-[16/9] w-full bg-[#ECECE7] relative overflow-hidden">
                 <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </div>
              <div className="p-[14px] flex flex-col gap-2">
                <div className="h-[18px] w-[70%] bg-[#ECECE7] rounded-md relative overflow-hidden">
                   <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
                <div className="h-[12px] w-[40%] bg-[#F0F0EB] rounded-md relative overflow-hidden">
                   <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!events || events.length === 0) {
      return (
        <div className="mt-[64px]">
          <EmptyState 
            icon={CalendarRange}
            heading={vibeFilter === "All" ? "No events yet" : `No ${vibeFilter} events yet`}
            subtext={getEmptySubtext(vibeFilter)}
            buttonText="Host a thing"
            onAction={() => navigate('/host')}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {events.map((event) => (
          <Link key={event.id} to={`/event/${event.id}`} className="group block active:scale-[0.98] transition-transform duration-100">
            <div className="flex flex-col rounded-2xl overflow-hidden bg-white">
              {event.cover_image_url ? (
                <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-100 shrink-0">
                  <img 
                    src={event.cover_image_url} 
                    alt="" 
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] w-full flex items-center justify-center bg-[#F5F5F2] shrink-0">
                   <span className="opacity-30 font-heading text-xl font-bold tracking-tighter text-primary uppercase">Gather</span>
                </div>
              )}
              
              <div className="px-[14px] pt-3 pb-[14px] flex flex-col">
                <span className="text-[11px] uppercase font-semibold tracking-wider text-neutral-400 mb-[6px]">
                   {getVibeLabel(event.vibe)}
                </span>
                <h3 className="font-semibold text-[16px] leading-snug line-clamp-2 text-[#1A1A1A] mb-1">
                  {event.title}
                </h3>
                
                <p className="text-[13px] text-neutral-500">
                  {format(new Date(event.event_datetime), 'MMM d')} <span className="mx-1 opacity-50">·</span> {event.location_text}
                </p>
                <p className="text-[12px] text-neutral-400 mt-2">
                  {event._count?.attendees || 0} going
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="page-transition pb-6 pt-[24px] px-5"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div 
        className="flex justify-center transition-all duration-200 overflow-hidden" 
        style={{ height: pullProgress > 0 ? `${pullProgress}px` : '0px' }}
      >
        <div className="flex items-end pb-2">
          <Loader2 
            className={`h-6 w-6 text-neutral-400 ${pullProgress > 60 ? 'animate-spin' : ''}`} 
            style={{ transform: `rotate(${pullProgress * 3}deg)` }} 
          />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="mb-[4px]">
          <p className="flex items-center text-[13px] text-neutral-400 font-normal tracking-wide mb-[4px] line-clamp-1">
            <MapPin className="h-3 w-3 text-neutral-400 mr-[4px]" />
            Siliguri, India
          </p>
          <h1 className="text-[32px] font-bold leading-none text-[#1A1A1A]" style={{ letterSpacing: '-0.5px' }}>Upcoming</h1>
        </div>
        
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar py-4">
          {VIBES.map((v) => (
            <button
              key={v}
              onClick={() => setVibeFilter(v)}
              className={`flex-shrink-0 px-[14px] h-[34px] text-[14px] font-medium rounded-full transition-colors ${
                vibeFilter === v 
                  ? 'bg-[#1A1A1A] text-white' 
                  : 'bg-white text-[#1A1A1A] border border-[#E5E5E0]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
