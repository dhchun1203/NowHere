import { supabase } from "./supabaseClient";
import type {
  Category,
  ContextSignal,
  Coordinates,
  Recommendation,
  ReviewSummary,
  Store,
  StoreWithDistance,
} from "./types";
import { fetchCurrentWeather, type WeatherCondition } from "./weather";

const NEARBY_RADIUS_METERS = 3000;
const MENTION_RATIO_THRESHOLD = 0.3;

function haversineMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type StoreRow = {
  id: string;
  name: string;
  category: Category;
  latitude: number | string;
  longitude: number | string;
  address: string;
  business_hours: Store["businessHours"];
  phone: string | null;
  avg_rating: number | string;
  review_count: number;
  tags: string[];
  updated_at: string;
  kakao_place_url: string | null;
};

function rowToStore(row: StoreRow): Store {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    address: row.address,
    businessHours: row.business_hours ?? {},
    phone: row.phone ?? "",
    avgRating: Number(row.avg_rating),
    reviewCount: row.review_count,
    tags: row.tags ?? [],
    updatedAt: row.updated_at,
    kakaoPlaceUrl: row.kakao_place_url ?? null,
  };
}

type ReviewSummaryRow = {
  id: string;
  store_id: string;
  attribute: string;
  mention_ratio: number | string;
  sentiment: ReviewSummary["sentiment"];
  sample_phrase: string;
  generated_at: string;
};

function rowToReviewSummary(row: ReviewSummaryRow): ReviewSummary {
  return {
    id: row.id,
    storeId: row.store_id,
    attribute: row.attribute,
    mentionRatio: Number(row.mention_ratio),
    sentiment: row.sentiment,
    samplePhrase: row.sample_phrase,
    generatedAt: row.generated_at,
  };
}

type ContextSignalRow = {
  id: string;
  store_id: string;
  signal_type: ContextSignal["signalType"];
  condition: ContextSignal["condition"];
  description: string;
  confidence: number | string;
};

function rowToContextSignal(row: ContextSignalRow): ContextSignal {
  return {
    id: row.id,
    storeId: row.store_id,
    signalType: row.signal_type,
    condition: row.condition ?? {},
    description: row.description,
    confidence: Number(row.confidence),
  };
}

async function getStoresNear(location: Coordinates, category: Category): Promise<StoreWithDistance[]> {
  const { data, error } = await supabase.from("stores").select("*").eq("category", category);
  if (error) throw error;

  return (data as StoreRow[])
    .map(rowToStore)
    .map((store) => ({ ...store, distanceMeters: haversineMeters(location, store) }))
    .filter((store) => store.distanceMeters <= NEARBY_RADIUS_METERS)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export async function fetchNearbyStores(
  category: Category,
  location: Coordinates
): Promise<StoreWithDistance[]> {
  return getStoresNear(location, category);
}

export async function fetchStoreDetail(id: string): Promise<Store | null> {
  const { data, error } = await supabase.from("stores").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToStore(data as StoreRow);
}

const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

// 카카오 로컬 API(키워드 검색)로 지역/장소명을 좌표로 변환한다.
// REST API 키는 클라이언트에 노출되지만(EXPO_PUBLIC_), Local API는 별도 활성화 없이
// 기본 무료 쿼터로 동작해서 카카오맵 JS SDK 때와 달리 결제수단 등록이 필요 없다.
// 프로덕션에서는 이 키를 서버/엣지 함수 뒤로 숨기는 게 정석이지만 MVP 단계에서는 생략.
export async function geocodeArea(query: string): Promise<{ coords: Coordinates; label: string } | null> {
  const trimmed = query.trim();
  if (!trimmed || !KAKAO_REST_API_KEY) return null;

  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(trimmed)}`,
      { headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const top = data.documents?.[0];
    if (!top) return null;
    return {
      coords: { latitude: Number(top.y), longitude: Number(top.x) },
      label: top.place_name,
    };
  } catch {
    return null;
  }
}

const recommendationCache = new Map<string, Recommendation>();

function matchesHour(hourRange: [number, number] | undefined, hour: number): boolean {
  if (!hourRange) return false;
  const [start, end] = hourRange;
  return hour >= start && hour < end;
}

function buildRecommendation(
  store: Store,
  reviews: ReviewSummary[],
  signals: ContextSignal[],
  now: Date,
  weather: WeatherCondition
): { score: number; reasonText: string; reasonSources: string[] } | null {
  const storeReviews = reviews
    .filter((r) => r.storeId === store.id && r.mentionRatio >= MENTION_RATIO_THRESHOLD)
    .sort((a, b) => b.mentionRatio - a.mentionRatio);
  const topReview = storeReviews[0];

  const hour = now.getHours();
  const storeSignals = signals
    .filter((c) => c.storeId === store.id)
    .filter((c) => matchesHour(c.condition.hourRange, hour) || c.condition.weather === weather);
  const topSignal = storeSignals.sort((a, b) => b.confidence - a.confidence)[0];

  if (!topReview && !topSignal) return null;

  const reasonParts: string[] = [];
  const reasonSources: string[] = [];

  if (topReview) {
    reasonParts.push(`리뷰에서 '${topReview.samplePhrase}'는 언급이 많아요`);
    reasonSources.push(`review_summary:${topReview.attribute}`);
  }
  if (topSignal) {
    reasonParts.push(topSignal.description);
    reasonSources.push(`context:${topSignal.signalType}`);
  }

  const overlapBonus = topReview && topSignal ? 0.3 : 0;
  const score = (topReview?.mentionRatio ?? 0) + (topSignal?.confidence ?? 0) + overlapBonus;

  return { score, reasonText: reasonParts.join(". ") + ".", reasonSources };
}

export async function fetchRecommendation(
  category: Category,
  location: Coordinates
): Promise<Recommendation | null> {
  const now = new Date();
  const cacheKey = `${category}:${Math.round(location.latitude * 100)}:${Math.round(location.longitude * 100)}:${now.getHours()}`;
  const cached = recommendationCache.get(cacheKey);
  if (cached && new Date(cached.expiresAt) > now) {
    return cached;
  }

  const stores = await getStoresNear(location, category);
  if (stores.length === 0) return null;

  const storeIds = stores.map((s) => s.id);
  const [reviewsRes, signalsRes, weather] = await Promise.all([
    supabase.from("review_summaries").select("*").in("store_id", storeIds).gte("mention_ratio", MENTION_RATIO_THRESHOLD),
    supabase.from("context_signals").select("*").in("store_id", storeIds),
    fetchCurrentWeather(location),
  ]);
  if (reviewsRes.error) throw reviewsRes.error;
  if (signalsRes.error) throw signalsRes.error;

  const reviews = (reviewsRes.data as ReviewSummaryRow[]).map(rowToReviewSummary);
  const signals = (signalsRes.data as ContextSignalRow[]).map(rowToContextSignal);

  let best: { store: Store; score: number; reasonText: string; reasonSources: string[] } | null = null;
  for (const store of stores) {
    const built = buildRecommendation(store, reviews, signals, now, weather);
    if (built && (!best || built.score > best.score)) {
      best = { store, ...built };
    }
  }

  if (!best) return null;

  const generatedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const recommendation: Recommendation = {
    store: best.store,
    reasonText: best.reasonText,
    reasonSources: best.reasonSources as Recommendation["reasonSources"],
    generatedAt,
    expiresAt,
  };
  recommendationCache.set(cacheKey, recommendation);
  return recommendation;
}
