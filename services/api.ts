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

const AREA_COORDINATES: { keywords: string[]; label: string; coords: Coordinates }[] = [
  { keywords: ["강남", "역삼", "테헤란"], label: "강남역", coords: { latitude: 37.4979, longitude: 127.0276 } },
  { keywords: ["홍대", "합정", "연남"], label: "홍대입구", coords: { latitude: 37.5563, longitude: 126.9236 } },
  { keywords: ["이태원", "한남"], label: "이태원", coords: { latitude: 37.5344, longitude: 126.9944 } },
  { keywords: ["잠실", "송파"], label: "잠실", coords: { latitude: 37.5133, longitude: 127.1001 } },
  { keywords: ["신촌", "이대"], label: "신촌", coords: { latitude: 37.5559, longitude: 126.9368 } },
  { keywords: ["여의도"], label: "여의도", coords: { latitude: 37.5219, longitude: 126.9245 } },
  { keywords: ["종로", "종각", "광화문"], label: "종로", coords: { latitude: 37.5704, longitude: 126.9831 } },
];

export async function geocodeArea(query: string): Promise<{ coords: Coordinates; label: string } | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const match = AREA_COORDINATES.find((area) => area.keywords.some((kw) => trimmed.includes(kw)));
  if (!match) return null;
  return { coords: match.coords, label: match.label };
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
