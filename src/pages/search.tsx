import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Search, X, Clock, SearchX, Activity, Palette, Users, BookOpen, Compass } from "lucide-react";
import { getRecentSearches, saveRecentSearch, removeRecentSearch, clearRecentSearches } from "@/lib/searchHistory";
import { useTrendingEvents, useLiveEventsSearch, useLiveHostsSearch } from "@/lib/queries";
import { SectionHeader, SearchResultRow, VibeCard } from "@/components/ui/search-components";

const PLACEHOLDERS = [
  "Search Gather",
  "Try 'jam session'",
  "Try 'this weekend'",
  "Try 'hiking'"
];

const VIBES = [
  { name: "Move", color: "#FFE4E1", icon: Activity },
  { name: "Create", color: "#E8E4FF", icon: Palette },
  { name: "Hang", color: "#FFF3E0", icon: Users },
  { name: "Learn", color: "#E4F4FF", icon: BookOpen },
  { name: "Explore", color: "#E4FFE8", icon: Compass },
];

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: trendingEvents } = useTrendingEvents();
  const { data: searchEvents } = useLiveEventsSearch(debouncedQuery);
  const { data: searchHosts } = useLiveHostsSearch(debouncedQuery);

  const isTyping = query.length > 0;

  useEffect(() => {
    setRecent(getRecentSearches());
    // Auto-focus on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Rotating placeholder
    const interval = setInterval(() => {
      setPlaceholderIdx((idx) => (idx + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Debounce query
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    // Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQuery("");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleSearchSubmit = (searchQuery: string) => {
    saveRecentSearch(searchQuery);
    setRecent(getRecentSearches());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(query);
      e.currentTarget.blur();
    }
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    handleSearchSubmit(term);
  };

  const handleRemoveRecent = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    removeRecentSearch(term);
    setRecent(getRecentSearches());
  };

  const handleClearAllRecent = () => {
    clearRecentSearches();
    setRecent([]);
  };

  const handleVibeClick = (vibeName: string) => {
    navigate(`/?vibe=${vibeName.toLowerCase()}`);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F2F2EF] pb-[100px] flex flex-col pt-4">
      {/* Header */}
      <div className="pb-3 pt-0 px-5">
        <h1 className="text-[28px] font-bold tracking-tight text-[#1A1A1A]">Search</h1>
      </div>

      {/* Search Input (Sticky) */}
      <div className="sticky top-0 z-20 px-5 py-2 bg-[#F2F2EF]">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-neutral-400 stroke-[2.5]" />
          <input 
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            className="w-full pl-11 pr-10 h-11 rounded-full bg-white text-[16px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none border border-transparent focus:border-neutral-300 transition-colors shadow-sm"
          />
          {isTyping && (
            <button 
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 outline-none"
            >
              <X className="h-[18px] w-[18px] stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 mt-2 flex-1">
        {!isTyping ? (
          <div className="animate-in fade-in duration-200 hide-scrollbar pb-10">
            {/* Empty State A: Recent */}
            {recent.length > 0 && (
              <div className="mb-2">
                <SectionHeader 
                  title="Recent" 
                  actionText="Clear" 
                  onAction={handleClearAllRecent} 
                />
                <div className="flex flex-col">
                  {recent.map((term, i) => (
                    <div 
                      key={term} 
                      onClick={() => handleRecentClick(term)}
                      className={`flex items-center h-11 cursor-pointer active:bg-neutral-200/50 -mx-5 px-5 ${i !== recent.length - 1 ? 'border-b border-[#E5E5E0]/60' : ''}`}
                    >
                      <Clock className="w-[14px] h-[14px] text-neutral-400 mr-3 shrink-0" />
                      <span className="text-[15px] text-neutral-700 flex-1 truncate">{term}</span>
                      <button 
                        onClick={(e) => handleRemoveRecent(e, term)}
                        className="p-2 -mr-2 text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="w-[14px] h-[14px]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State B: Trending */}
            <div>
              <SectionHeader title="Trending in Siliguri" />
              <div className="flex flex-col gap-3">
                {trendingEvents && trendingEvents.length > 0 ? (
                  trendingEvents.map((event) => (
                    <SearchResultRow 
                      key={event.id} 
                      type="event" 
                      data={event} 
                      onClick={() => {}}
                    />
                  ))
                ) : (
                  <div className="py-2">
                    <p className="text-[14px] text-neutral-500 mb-2">Be the first to host something in Siliguri.</p>
                    <button 
                      onClick={() => navigate('/host')}
                      className="text-[14px] font-semibold text-[#FF6B35] active:opacity-70"
                    >
                      Host
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Empty State C: Browse by Vibe */}
            <div className="mt-2 mb-4">
              <SectionHeader title="Browse" />
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-5 px-5">
                {VIBES.map(v => (
                  <VibeCard 
                    key={v.name}
                    vibe={v.name}
                    color={v.color}
                    icon={v.icon}
                    onClick={() => handleVibeClick(v.name)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-200 pb-10">
            {/* Live Search Results */}
            
            {(searchEvents?.length === 0 && searchHosts?.length === 0) ? (
              <div className="flex flex-col items-center justify-center text-center mt-[64px]">
                <SearchX className="h-10 w-10 text-neutral-300 mb-3" strokeWidth={1.5} />
                <h3 className="text-[15px] font-semibold text-neutral-700 mb-1">No matches for '{debouncedQuery}'</h3>
                <p className="text-[13px] text-neutral-500">Try a different search or browse by vibe instead.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {searchEvents && searchEvents.length > 0 && (
                  <div>
                    <SectionHeader title="Events" count={searchEvents.length} />
                    <div className="flex flex-col gap-3">
                      {searchEvents.map(event => (
                        <SearchResultRow 
                          key={event.id} 
                          type="event" 
                          data={event}
                          onClick={() => handleSearchSubmit(query)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {searchHosts && searchHosts.length > 0 && (
                  <div>
                    <SectionHeader title="People" count={searchHosts.length} />
                    <div className="flex flex-col gap-3">
                      {searchHosts.map(host => (
                        <SearchResultRow 
                          key={host.id} 
                          type="user" 
                          data={host}
                          onClick={() => {
                            // TODO: Navigate to public profile
                            handleSearchSubmit(query);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
