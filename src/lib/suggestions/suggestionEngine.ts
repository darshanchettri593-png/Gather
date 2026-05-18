import { SUGGESTION_POOL, SuggestionItem } from './suggestionPool'
import type { WeatherCondition } from '../weather'

function getSeason(month: number): 'summer' | 'monsoon' | 'winter' {
  if (month >= 5 && month <= 9) return 'monsoon'
  if (month >= 10 || month <= 1) return 'winter'
  return 'summer'
}

function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour < 11) return 'morning'
  if (hour < 16) return 'afternoon'
  if (hour < 20) return 'evening'
  return 'night'
}

function getDayType(day: number): 'weekday' | 'weekend' {
  return (day === 0 || day === 6) ? 'weekend' : 'weekday'
}

function getRegion(cityName: string): 'hills' | 'metro' | 'coastal' | 'college' | 'any' {
  if (!cityName) return 'any'
  const c = cityName.toLowerCase()
  const hills = ['kalimpong', 'darjeeling', 'gangtok', 'shimla', 'manali', 'ooty', 'shillong', 'kodaikanal', 'dharamshala', 'nainital', 'mussoorie', 'kurseong', 'mirik', 'sikkim']
  const metro = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'kolkata', 'chennai', 'hyderabad', 'pune', 'noida', 'gurgaon', 'gurugram', 'ahmedabad', 'surat', 'jaipur', 'lucknow']
  const coastal = ['goa', 'kochi', 'pondicherry', 'puducherry', 'mangalore', 'visakhapatnam', 'panaji', 'mumbai', 'chennai', 'kozhikode', 'varkala', 'alleppey']
  const college = ['siliguri', 'manipal', 'vellore', 'roorkee', 'kharagpur', 'pilani', 'bhopal', 'indore', 'kanpur', 'varanasi', 'allahabad', 'patna']
  if (hills.some(h => c.includes(h))) return 'hills'
  if (coastal.some(co => c.includes(co))) return 'coastal'
  if (metro.some(m => c.includes(m))) return 'metro'
  if (college.some(co => c.includes(co))) return 'college'
  return 'any'
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const copy = [...arr]
  let s = 0
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export interface SuggestionContext {
  weather: WeatherCondition | null
  cityName: string
  userId: string
}

export function getSmartSuggestions(ctx: SuggestionContext, count: number = 3): SuggestionItem[] {
  const now = new Date()
  const hour = now.getHours()
  const month = now.getMonth() + 1
  const day = now.getDay()
  const timeOfDay = getTimeOfDay(hour)
  const season = getSeason(month)
  const dayType = getDayType(day)
  const region = getRegion(ctx.cityName)

  const scored = SUGGESTION_POOL.map(item => {
    let score = 0
    if (ctx.weather && item.weather.includes(ctx.weather)) score += 5
    if (item.time.includes(timeOfDay)) score += 3
    if (item.season.includes(season) || item.season.includes('any')) score += 1
    if (item.region.includes(region) || item.region.includes('any')) score += 2
    if (item.dayType.includes(dayType) || item.dayType.includes('any')) score += 1
    return { item, score }
  })

  const matched = scored.filter(s => s.score >= 6).sort((a, b) => b.score - a.score)
  const pool = matched.length >= count
    ? matched
    : scored.filter(s => s.score >= 4).sort((a, b) => b.score - a.score)
  const finalPool = pool.length >= count
    ? pool
    : scored.sort((a, b) => b.score - a.score).slice(0, 30)

  let sessionSeed = sessionStorage.getItem('gather_suggestion_seed')
  if (!sessionSeed) {
    sessionSeed = `${ctx.userId}_${Date.now()}`
    sessionStorage.setItem('gather_suggestion_seed', sessionSeed)
  }

  const shuffled = seededShuffle(finalPool.slice(0, 30).map(s => s.item), sessionSeed)
  return shuffled.slice(0, count)
}
