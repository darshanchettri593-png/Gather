import { useEffect, useState } from 'react'

export type WeatherCondition = 'sunny' | 'partly_cloudy' | 'cloudy' | 'foggy' | 'drizzle' | 'rainy' | 'thunderstorm' | 'snow' | 'windy'

export interface WeatherData {
  temp: number
  condition: WeatherCondition
  conditionLabel: string
  windKmh: number
  rainChance: number
  sunsetTime: string
  fetchedAt: number
}

function getConditionFromCode(code: number, wind: number): { c: WeatherCondition; label: string } {
  if (wind > 25) return { c: 'windy', label: 'Windy' }
  if (code === 0) return { c: 'sunny', label: 'Sunny' }
  if (code >= 1 && code <= 2) return { c: 'partly_cloudy', label: 'Partly cloudy' }
  if (code === 3) return { c: 'cloudy', label: 'Cloudy' }
  if (code === 45 || code === 48) return { c: 'foggy', label: 'Foggy' }
  if (code >= 51 && code <= 57) return { c: 'drizzle', label: 'Drizzle' }
  if (code >= 61 && code <= 67) return { c: 'rainy', label: 'Rainy' }
  if (code >= 80 && code <= 82) return { c: 'rainy', label: 'Showers' }
  if (code >= 95) return { c: 'thunderstorm', label: 'Thunderstorm' }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { c: 'snow', label: 'Snow' }
  return { c: 'cloudy', label: 'Cloudy' }
}

export function useWeather(lat?: number | null, lng?: number | null) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!lat || !lng) return

    const cacheKey = `gather_weather_${lat.toFixed(2)}_${lng.toFixed(2)}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed: WeatherData = JSON.parse(cached)
        if (Date.now() - parsed.fetchedAt < 30 * 60 * 1000) {
          setWeather(parsed)
          return
        }
      } catch {}
    }

    setLoading(true)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,precipitation_probability&daily=sunset&timezone=auto&forecast_days=1`

    fetch(url)
      .then(r => r.json())
      .then(data => {
        const code = data.current?.weather_code ?? 3
        const wind = data.current?.wind_speed_10m ?? 0
        const { c, label } = getConditionFromCode(code, wind)
        const sunsetISO = data.daily?.sunset?.[0]
        const sunsetTime = sunsetISO
          ? new Date(sunsetISO).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
          : '6:30 PM'
        const w: WeatherData = {
          temp: Math.round(data.current?.temperature_2m ?? 20),
          condition: c,
          conditionLabel: label,
          windKmh: Math.round(wind),
          rainChance: Math.round(data.current?.precipitation_probability ?? 0),
          sunsetTime,
          fetchedAt: Date.now(),
        }
        localStorage.setItem(cacheKey, JSON.stringify(w))
        setWeather(w)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lat, lng])

  return { weather, loading }
}
