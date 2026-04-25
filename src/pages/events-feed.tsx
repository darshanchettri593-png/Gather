import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { format } from "date-fns";
import { CalendarRange, AlertCircle, MapPin, Loader2, ChevronDown, CalendarDays, Users, Check } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { EmptyState } from "@/pages/profile";

const VIBES = ["All", "Move", "Create", "Hang", "Learn", "Explore"];
const DISTRICTS = [
  "Matigara", "Pradhan Nagar", "Sevoke Road", "Panitanki", 
  "Hakimpara", "Khalpara", "Bhakti Nagar", "Other"
];

const CITIES = [
  "Siliguri", "Kolkata", "Delhi", "Mumbai", "Bangalore", 
  "Chennai", "Hyderabad", "Pune", "Darjeeling", "Jalpaiguri"
];

function getVibeLabel(vibe: string) {
  if (vibe === "All") return "All events";
  return vibe;
}

function FeaturedEventCard({ event }: { event: any }) {
  return (
    <Link to={`/event/${event.id}`} className="group block active:scale-[0.98] transition-transform duration-100">
      <div className="flex flex-col bg-[#242422] rounded-[20px] border border-[#2E2E2C] overflow-hidden">
        <div className="relative aspect-[16/9] w-full rounded-t-[16px] overflow-hidden bg-[#2C2C2A] shrink-0">
          {event.cover_image_url ? (
            <img 
              src={event.cover_image_url} 
              alt="" 
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
             <div className="h-full w-full flex items-center justify-center bg-[#2C2C2A]">
               <span className="opacity-30 font-heading text-[24px] font-bold text-[#F0F0EA] uppercase">Gather</span>
             </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(28,28,26,0.95)] via-[rgba(28,28,26,0.4)] to-transparent pointer-events-none" />
          
          <div className="absolute top-[12px] left-[12px] bg-[rgba(28,28,26,0.7)] backdrop-blur-md border border-[#383836] rounded-full px-[10px] py-[4px]">
            <span className="text-[11px] uppercase text-[#9A9A8E] font-medium tracking-wider">
              {getVibeLabel(event.vibe)}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-[16px] pb-[16px]">
            <h3 className="font-bold text-[24px] leading-tight text-[#F0F0EA] line-clamp-2">
              {event.title}
            </h3>
          </div>
        </div>
        
        <div className="px-[16px] py-[14px] flex flex-col gap-[10px]">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-[14px] h-[14px] text-[#FF6B35]" />
              <span className="text-[14px] text-[#9A9A8E]">{format(new Date(event.event_datetime), 'MMM d, h:mm a')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-[14px] h-[14px] text-[#FF6B35]" />
              <span className="text-[14px] text-[#9A9A8E] truncate">{event.location_text}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Users className="w-[13px] h-[13px] text-[#5A5A52]" />
              <span className="text-[13px] text-[#5A5A52]">{event._count?.attendees || 0} going</span>
            </div>
          </div>
          
          <div className="mt-1 flex items-center">
            <div className="bg-[#2C2C2A] border border-[#383836] rounded-full px-2 py-[2px]">
              <span className="text-[11px] text-[#9A9A8E] uppercase tracking-wider font-medium">{event.district || 'Siliguri'}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CompactEventCard({ event }: { event: any }) {
  const firstLetter = event.vibe === 'All' || !event.vibe ? 'G' : event.vibe.charAt(0).toUpperCase();
  return (
    <Link to={`/event/${event.id}`} className="group block active:scale-[0.98] transition-transform duration-100">
      <div className="flex flex-row p-[12px] rounded-[16px] bg-[#242422] border border-[#2E2E2C] w-full gap-[12px]">
        {event.cover_image_url ? (
          <div className="w-[76px] h-[76px] shrink-0 rounded-[12px] overflow-hidden bg-[#2C2C2A]">
            <img 
              src={event.cover_image_url} 
              alt="" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="w-[76px] h-[76px] shrink-0 flex items-center justify-center bg-[#2C2C2A] rounded-[12px]">
            <span className="opacity-50 font-heading text-[24px] font-bold text-[#F0F0EA]">{firstLetter}</span>
          </div>
        )}
        
        <div className="flex flex-col flex-1 min-w-0 justify-center gap-1">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-[#FF6B35] block mb-[2px]">
              {getVibeLabel(event.vibe)}
            </span>
            <h3 className="font-semibold text-[15px] leading-[1.3] line-clamp-2 text-[#F0F0EA]">
              {event.title}
            </h3>
          </div>
          <div className="flex flex-col gap-[2px]">
            <span className="text-[12px] text-[#5A5A52] truncate">
              {format(new Date(event.event_datetime), 'MMM d')} <span className="opacity-50">·</span> {event.location_text}
            </span>
            <span className="text-[12px] text-[#5A5A52]">
              {event._count?.attendees || 0} going
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function EventFeedPage() {
  const navigate = useNavigate();
  const [vibeFilter, setVibeFilter] = useState<string>("All");
  const [city, setCity] = useState<string>(localStorage.getItem('gather_city') || "Siliguri");
  const [districtFilter, setDistrictFilter] = useState<string>("All");
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  const { data: events, isLoading, error, refetch } = useEvents(vibeFilter, city, districtFilter);

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

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    localStorage.setItem('gather_city', selectedCity);
    setIsCityModalOpen(false);
  };

  const getEmptySubtext = (vibe: string, district: string) => {
    const loc = district === 'All' ? city : district;
    switch (vibe) {
      case "Move": return `No Move events yet. Host a run, gym session, or yoga class in ${loc}.`;
      case "Create": return `No Create events yet. Host a jam, art session, or craft meet in ${loc}.`;
      case "Hang": return `No Hang events yet. Host a dinner, game night, or casual meet in ${loc}.`;
      case "Learn": return `No Learn events yet. Host a workshop, book club, or talk in ${loc}.`;
      case "Explore": return `No Explore events yet. Host a trip, food tour, or adventure in ${loc}.`;
      default: return `Be the one who starts something in ${loc}.`;
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <AlertCircle className="h-10 w-10 text-[#5A5A52] mb-3" strokeWidth={1.5} />
          <h3 className="text-[17px] font-semibold text-[#F0F0EA] mb-1.5">Couldn't load events</h3>
          <p className="text-[13px] text-[#9A9A8E] max-w-[280px]">
            Something went wrong on our end. Try again in a sec.
          </p>
          <button 
            onClick={() => refetch()}
            className="mt-4 px-6 py-2 rounded-full border border-[#383836] text-[#F0F0EA] font-medium active:bg-[#2C2C2A] transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col gap-[12px] px-[16px]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-[20px] overflow-hidden bg-[#242422] border border-[#2E2E2C]">
              <div className="aspect-[16/9] w-full bg-[#2C2C2A] relative overflow-hidden">
                 <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              </div>
              <div className="p-[16px] flex flex-col gap-3">
                <div className="h-[20px] w-[70%] bg-[#2C2C2A] rounded-md relative overflow-hidden">
                   <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>
                <div className="h-[14px] w-[40%] bg-[#2C2C2A] rounded-md relative overflow-hidden">
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
            subtext={getEmptySubtext(vibeFilter, districtFilter)}
            buttonText="Host a thing"
            onAction={() => navigate('/host')}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-[12px] px-[16px]">
        {events.map((event, index) => {
          if (index === 0) {
            return <FeaturedEventCard key={event.id} event={event} />;
          }
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
      {/* Location Selector - Sticky below the main header */}
      <div className="sticky top-[56px] z-40 bg-[#1C1C1A] pt-[12px] pb-[8px]">
        <div className="px-[20px] flex items-center justify-between">
          <button 
            className="flex items-center gap-1.5 active:opacity-70 transition-opacity"
            onClick={() => setIsCityModalOpen(true)}
          >
            <MapPin className="h-[14px] w-[14px] text-[#FF6B35]" />
            <span className="text-[16px] font-semibold text-[#F0F0EA]">{city}</span>
            <ChevronDown className="h-[14px] w-[14px] text-[#9A9A8E]" />
          </button>
          <button 
            className="text-[13px] text-[#FF6B35] font-medium active:opacity-70"
            onClick={() => setIsCityModalOpen(true)}
          >
            change
          </button>
        </div>

        {/* District Pills */}
        <div className="flex gap-[8px] overflow-x-auto hide-scrollbar pt-[12px] pb-[4px] px-[20px]">
          <button
            onClick={() => setDistrictFilter("All")}
            className={`flex-shrink-0 h-[32px] px-[14px] text-[13px] font-medium rounded-full transition-colors ${
              districtFilter === "All"
                ? 'bg-[#FF6B35] text-white border-none' 
                : 'bg-[#242422] text-[#9A9A8E] border border-[#2E2E2C] hover:border-[#FF6B35]'
            }`}
          >
            All
          </button>
          {DISTRICTS.map((d) => (
            <button
              key={d}
              onClick={() => setDistrictFilter(d)}
              className={`flex-shrink-0 h-[32px] px-[14px] text-[13px] font-medium rounded-full transition-colors ${
                districtFilter === d
                  ? 'bg-[#FF6B35] text-white border-none' 
                  : 'bg-[#242422] text-[#9A9A8E] border border-[#2E2E2C] hover:border-[#FF6B35]'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Pull to refresh indicator */}
      <div 
        className="flex justify-center transition-all duration-200 overflow-hidden" 
        style={{ height: pullProgress > 0 ? `${pullProgress}px` : '0px' }}
      >
        <div className="flex items-end pb-2">
          <Loader2 
            className={`h-6 w-6 text-[#5A5A52] ${pullProgress > 60 ? 'animate-spin' : ''}`} 
            style={{ transform: `rotate(${pullProgress * 3}deg)` }} 
          />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="px-[20px] pt-[8px] pb-[8px]">
          <h2 className="text-[22px] font-bold text-[#F0F0EA]">
            Upcoming in {districtFilter === "All" ? city : districtFilter}
          </h2>
        </div>
        
        {/* Vibe Pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar px-[20px] mb-[16px] pb-2">
          {VIBES.map((v) => (
            <button
              key={v}
              onClick={() => setVibeFilter(v)}
              className={`flex-shrink-0 px-[14px] h-[34px] text-[14px] font-medium rounded-full transition-colors ${
                vibeFilter === v 
                  ? 'bg-[#F0F0EA] text-[#1C1C1A]' 
                  : 'bg-[#242422] text-[#9A9A8E] border border-[#2E2E2C] hover:border-[#FF6B35]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
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
              <div className="w-[40px] h-[4px] bg-[#383836] rounded-full" />
            </div>
            
            <div className="px-[20px] pb-[16px]">
              <h3 className="text-[17px] font-semibold text-[#F0F0EA]">Choose your city</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto px-[20px] pb-[env(safe-area-inset-bottom,20px)]">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => handleCitySelect(c)}
                  className="w-full flex items-center justify-between h-[52px] border-b border-[#2E2E2C] last:border-0 active:opacity-70 transition-opacity"
                >
                  <span className={`text-[16px] font-medium ${city === c ? 'text-[#FF6B35]' : 'text-[#F0F0EA]'}`}>
                    {c}
                  </span>
                  {city === c && (
                    <div className="w-2 h-2 rounded-full bg-[#FF6B35]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
