import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Search, X, Clock, Activity, Palette, Users, BookOpen, Compass } from "lucide-react";
import { getRecentSearches, saveRecentSearch, removeRecentSearch, clearRecentSearches } from "@/lib/searchHistory";
import { useTrendingEvents, useLiveEventsSearch, useLiveHostsSearch } from "@/lib/queries";
import { SectionHeader, SearchResultRow } from "@/components/ui/search-components";

const PLACEHOLDERS = [
  "Search events...",
  "Try 'jam session'",
  "Try 'hiking'",
  "Try 'book club'",
];

// 2-col vibe grid — solid dark backgrounds, per-vibe icon color
const VIBES = [
  { name: "Move",    icon: Activity,  bg: "#1E1510", iconColor: "#FF6B35" },
  { name: "Create",  icon: Palette,   bg: "#11101E", iconColor: "#7B7FFF" },
  { name: "Hang",    icon: Users,     bg: "#1E1610", iconColor: "#FFB347" },
  { name: "Learn",   icon: BookOpen,  bg: "#101519", iconColor: "#47C1D3" },
  { name: "Explore", icon: Compass,   bg: "#101E12", iconColor: "#4CAF50" },
];

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: trendingEvents } = useTrendingEvents();
  const { data: searchEvents } = useLiveEventsSearch(debouncedQuery);
  const { data: searchHosts } = useLiveHostsSearch(debouncedQuery);

  const isTyping = query.length > 0;

  useEffect(() => {
    setRecent(getRecentSearches());
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuery("");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleSearchSubmit = (q: string) => {
    saveRecentSearch(q);
    setRecent(getRecentSearches());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
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

  const handleVibeClick = (vibeName: string) => {
    navigate(`/?vibe=${vibeName.toLowerCase()}`);
  };

  return (
    <div
      className="page-transition max-w-md mx-auto min-h-screen flex flex-col"
      style={{ backgroundColor: "#111110", paddingBottom: "80px" }}
    >
      {/* Title row */}
      <div style={{ padding: "20px 20px 12px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#F0EEE9" }}>Search</h1>
      </div>

      {/* Search bar */}
      <div style={{ margin: "0 20px 24px" }}>
        <div
          className="flex items-center gap-[10px]"
          style={{
            height: "48px",
            backgroundColor: "#1C1C1A",
            border: "1px solid #2A2A28",
            borderRadius: "14px",
            padding: "0 16px",
          }}
        >
          <Search size={18} color="#6B6B63" strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            className="flex-1 bg-transparent outline-none border-none"
            style={{
              fontSize: "16px",
              color: "#F0EEE9",
            }}
          />
          {isTyping && (
            <button
              onClick={handleClear}
              className="active:opacity-60 transition-opacity"
            >
              <X size={18} color="#6B6B63" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1" style={{ padding: "0 20px" }}>
        {!isTyping ? (
          <div>
            {/* Recent searches */}
            {recent.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <div className="flex items-center justify-between" style={{ marginBottom: "8px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#6B6B63",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    RECENT
                  </span>
                  <button
                    onClick={() => { clearRecentSearches(); setRecent([]); }}
                    style={{ fontSize: "13px", color: "#FF6B35" }}
                    className="active:opacity-60 transition-opacity"
                  >
                    Clear
                  </button>
                </div>
                {recent.map((term, i) => (
                  <div
                    key={term}
                    onClick={() => handleRecentClick(term)}
                    className="flex items-center gap-3 cursor-pointer active:opacity-60 transition-opacity"
                    style={{
                      height: "48px",
                      borderBottom: i < recent.length - 1 ? "1px solid #2A2A28" : "none",
                    }}
                  >
                    <Clock size={14} color="#3D3D38" strokeWidth={1.8} />
                    <span
                      style={{ fontSize: "15px", color: "#6B6B63", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {term}
                    </span>
                    <button
                      onClick={(e) => handleRemoveRecent(e, term)}
                      className="active:opacity-60"
                    >
                      <X size={14} color="#3D3D38" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Browse by vibe */}
            <div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#6B6B63",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  display: "block",
                  marginBottom: "12px",
                }}
              >
                BROWSE BY VIBE
              </span>

              {/* 2-col grid — last card spans full width if count is odd */}
              <div
                className="grid grid-cols-2 gap-[10px]"
                style={{ marginBottom: "24px" }}
              >
                {VIBES.map((v, index) => {
                  const isLastOdd =
                    index === VIBES.length - 1 && VIBES.length % 2 !== 0;
                  return (
                    <button
                      key={v.name}
                      onClick={() => handleVibeClick(v.name)}
                      className="flex flex-col items-center justify-center active:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: v.bg,
                        border: "1px solid #2A2A28",
                        borderRadius: "16px",
                        gridColumn: isLastOdd ? "span 2" : "span 1",
                        aspectRatio: isLastOdd ? "unset" : "1 / 1",
                        height: isLastOdd ? "100px" : undefined,
                      }}
                    >
                      <v.icon size={28} strokeWidth={1.8} color={v.iconColor} fill="none" />
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#F0EEE9",
                          marginTop: "8px",
                        }}
                      >
                        {v.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Live results */}
            {searchEvents?.length === 0 && searchHosts?.length === 0 ? (
              <div
                className="flex items-center justify-center"
                style={{ paddingTop: "60px" }}
              >
                <p style={{ fontSize: "15px", color: "#6B6B63" }}>Nothing matched.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {searchEvents && searchEvents.length > 0 && (
                  <div>
                    <SectionHeader title="Events" count={searchEvents.length} />
                    <div className="flex flex-col gap-[10px]" style={{ marginTop: "8px" }}>
                      {searchEvents.map((event) => (
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
                    <div className="flex flex-col gap-[10px]" style={{ marginTop: "8px" }}>
                      {searchHosts.map((host) => (
                        <SearchResultRow
                          key={host.id}
                          type="user"
                          data={host}
                          onClick={() => handleSearchSubmit(query)}
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
