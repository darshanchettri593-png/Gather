export const RECENT_SEARCHES_KEY = "gather_recent_searches";

export function getRecentSearches(): string[] {
  try {
    const item = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!item) return [];
    return JSON.parse(item);
  } catch (err) {
    return [];
  }
}

export function saveRecentSearch(query: string) {
  if (!query || query.trim().length < 2) return;
  const normalized = query.trim();
  
  let searches = getRecentSearches();
  
  // Remove if exists to move it to the top
  searches = searches.filter(s => s.toLowerCase() !== normalized.toLowerCase());
  
  searches.unshift(normalized);
  
  // Cap at 5
  if (searches.length > 5) {
    searches = searches.slice(0, 5);
  }
  
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
}

export function removeRecentSearch(query: string) {
  const normalized = query.trim();
  let searches = getRecentSearches();
  searches = searches.filter(s => s.toLowerCase() !== normalized.toLowerCase());
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
}

export function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}
