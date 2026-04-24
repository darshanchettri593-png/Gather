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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col group block">
              <div className="flex flex-col rounded-xl overflow-hidden bg-white/50">
                <div className="aspect-[16/9] w-full bg-[#ECECE7] rounded-xl relative overflow-hidden">
                   <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                </div>
                <div className="px-1 pt-[16px] pb-4 flex flex-col gap-2">
                  <div className="h-[18px] w-[70%] bg-[#ECECE7] rounded-md relative overflow-hidden">
                     <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  </div>
                  <div className="h-[12px] w-[40%] bg-[#F0F0EB] rounded-md relative overflow-hidden">
                     <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {events.map((event) => (
          <Link key={event.id} to={`/event/${event.id}`} className="group block active:scale-[0.98] transition-transform duration-100">
            <div className="flex flex-col rounded-2xl overflow-hidden bg-white/50 transition-all duration-200 hover:-translate-y-0.5">
              {event.cover_image_url ? (
                <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-100 shrink-0 rounded-xl">
                  <img 
                    src={event.cover_image_url} 
                    alt="" 
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] w-full flex items-center justify-center bg-[#F5F5F2] shrink-0 rounded-xl">
                   <span className="opacity-30 font-heading text-xl font-bold tracking-tighter text-primary uppercase">Gather</span>
                </div>
              )}
              
              <div className="p-4 flex flex-col pt-3 px-1">
                <div className="mb-0.5">
                   <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                      {getVibeLabel(event.vibe)}
                   </span>
                </div>
                <h3 className="font-semibold text-[17px] leading-snug line-clamp-2 text-neutral-900 mb-1">
                  {event.title}
                </h3>
                
                <div className="flex justify-between items-end mt-1">
                  <p className="text-[13px] text-neutral-600">
                    {format(new Date(event.event_datetime), 'MMM d')} <span className="mx-1 opacity-50">·</span> {event.location_text}
                  </p>
                  <p className="text-[12px] font-medium text-neutral-400">
                    {event._count?.attendees || 0} going
                  </p>
                </div>
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
      className="space-y-6 sm:space-y-8 pb-6 pt-[12px]"
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
        <div className="px-1 mb-[8px]">
          <p className="flex items-center text-[13px] text-neutral-500 font-normal tracking-wide mb-[2px] line-clamp-1">
            <MapPin className="h-3 w-3 text-neutral-400 mr-[4px]" />
            Siliguri, India
          </p>
          <h1 className="text-[34px] font-bold tracking-tight leading-none text-neutral-900">Upcoming</h1>
        </div>
        
        {/* Category Pills container with fade mask */}
        <div className="relative -mx-4 sm:mx-0 mb-[12px]">
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#FAFAF7] to-transparent pointer-events-none z-10 sm:hidden" />
          <div className="px-4 sm:px-1 flex gap-2 overflow-x-auto scrollbar-hide py-1 pr-[24px]">
            {VIBES.map((v) => (
              <button
                key={v}
                onClick={() => setVibeFilter(v)}
                className={`flex-shrink-0 px-4 h-[32px] text-[16px] font-medium rounded-full active:opacity-70 transition-colors ${
                  vibeFilter === v 
                    ? 'bg-[#1A1A1A] text-white' 
                    : 'bg-[#ECECE7] text-neutral-700'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#FAFAF7] to-transparent pointer-events-none z-10 sm:hidden" />
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
