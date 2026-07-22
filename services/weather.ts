import type { Coordinates } from "./types";

export type WeatherCondition = "rain" | "clear" | "snow";

const CACHE_TTL_MS = 30 * 60 * 1000;
const weatherCache = new Map<string, { value: WeatherCondition; expiresAt: number }>();

// WMO 날씨 코드(Open-Meteo가 사용) -> 앱에서 쓰는 3단계 분류.
// https://open-meteo.com/en/docs 의 weather_code 표 기준.
function mapWeatherCode(code: number): WeatherCondition {
  const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
  const snowCodes = [71, 73, 75, 77, 85, 86];
  if (rainCodes.includes(code)) return "rain";
  if (snowCodes.includes(code)) return "snow";
  return "clear";
}

export async function fetchCurrentWeather(location: Coordinates): Promise<WeatherCondition> {
  const cacheKey = `${Math.round(location.latitude * 10)}:${Math.round(location.longitude * 10)}`;
  const cached = weatherCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=weather_code`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`weather API HTTP ${res.status}`);
    const data = await res.json();
    const condition = mapWeatherCode(data.current.weather_code);
    weatherCache.set(cacheKey, { value: condition, expiresAt: now + CACHE_TTL_MS });
    return condition;
  } catch {
    // 날씨는 보조 신호라 API 장애 시에도 추천 로직 전체가 죽으면 안 되므로 기본값으로 대체.
    return "clear";
  }
}
