import { useQuery } from "@tanstack/react-query";
import { fetchNearbyStores, fetchRecommendation, fetchStoreDetail, fetchStoreReviewSummaries } from "../services/api";
import type { Category, Coordinates } from "../services/types";

export function useNearbyStores(category: Category | undefined, location: Coordinates | null) {
  return useQuery({
    queryKey: ["nearby-stores", category, location?.latitude, location?.longitude],
    queryFn: () => fetchNearbyStores(category as Category, location as Coordinates),
    enabled: !!category && !!location,
  });
}

export function useRecommendation(category: Category | undefined, location: Coordinates | null) {
  return useQuery({
    queryKey: ["recommendation", category, location?.latitude, location?.longitude],
    queryFn: () => fetchRecommendation(category as Category, location as Coordinates),
    enabled: !!category && !!location,
  });
}

export function useStoreDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["store-detail", id],
    queryFn: () => fetchStoreDetail(id as string),
    enabled: !!id,
  });
}

export function useStoreReviewSummaries(id: string | undefined) {
  return useQuery({
    queryKey: ["store-review-summaries", id],
    queryFn: () => fetchStoreReviewSummaries(id as string),
    enabled: !!id,
  });
}
