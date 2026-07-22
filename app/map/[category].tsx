import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Platform, ScrollView, Text, View } from "react-native";
import { CATEGORIES } from "../../constants/categories";
import { useTheme } from "../../constants/theme";
import { isKakaoMapAvailable, KakaoMapView } from "../../components/KakaoMapView";
import { MapMarker } from "../../components/MapMarker";
import { RecommendationCard } from "../../components/RecommendationCard";
import { StoreListItem } from "../../components/StoreListItem";
import { StoreListItemSkeleton } from "../../components/StoreListItemSkeleton";
import { Chip } from "../../components/ui/Chip";
import { useLocation } from "../../hooks/useLocation";
import { useNearbyStores, useRecommendation } from "../../hooks/useNearbyStores";
import { categoryColors } from "../../constants/theme";
import type { Category, StoreWithDistance } from "../../services/types";

// react-native-webview는 web에서 지원되지 않아 더미 컴포넌트만 렌더링한다.
// 네이티브(iOS/Android)에서 카카오맵 키가 있을 때만 실제 지도를 쓰고, 그 외엔 기존 placeholder로 대체한다.
const USE_KAKAO_MAP = Platform.OS !== "web" && isKakaoMapAvailable();

const MAP_PADDING = 0.15;

function projectToPercent(
  value: number,
  min: number,
  max: number,
  invert = false
): number {
  if (max - min < 1e-9) return 50;
  const ratio = (value - min) / (max - min);
  const padded = MAP_PADDING * 100 + ratio * (100 - MAP_PADDING * 200);
  return invert ? 100 - padded : padded;
}

export default function MapScreen() {
  const { category } = useLocalSearchParams<{ category: Category }>();
  const router = useRouter();
  const location = useLocation();
  const { colors, spacing } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const categoryInfo = CATEGORIES.find((c) => c.key === category);

  const storesQuery = useNearbyStores(category, location.coords);
  const recommendationQuery = useRecommendation(category, location.coords);

  const stores = storesQuery.data ?? [];
  const recommendation = recommendationQuery.data ?? null;

  const bounds = useMemo(() => {
    const lats = stores.map((s) => s.latitude);
    const lngs = stores.map((s) => s.longitude);
    if (location.coords) {
      lats.push(location.coords.latitude);
      lngs.push(location.coords.longitude);
    }
    if (lats.length === 0) return null;
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }, [stores, location.coords]);

  if (!location.coords) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 }}>
        <Stack.Screen options={{ title: categoryInfo?.label ?? "" }} />
        <Text style={{ fontSize: 15, color: colors.textSecondary }}>위치 정보가 없어요.</Text>
        <Text
          style={{ fontSize: 14, color: colors.primary, fontFamily: "Pretendard-Bold" }}
          onPress={() => router.push("/location-search")}
        >
          지역을 직접 입력하기
        </Text>
      </View>
    );
  }

  const isLoading = storesQuery.isLoading || recommendationQuery.isLoading;
  const highlightedStoreIds = useMemo(() => {
    const ids = new Set<string>();
    if (selectedId) ids.add(selectedId);
    if (recommendation) ids.add(recommendation.store.id);
    return Array.from(ids);
  }, [selectedId, recommendation]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Stack.Screen options={{ title: `${categoryInfo?.emoji ?? ""} ${categoryInfo?.label ?? ""}` }} />

      <View style={{ height: 220, backgroundColor: "#E9EEF1", position: "relative", overflow: "hidden" }}>
        {USE_KAKAO_MAP ? (
          <KakaoMapView
            userLocation={location.coords}
            stores={stores}
            categoryEmoji={categoryInfo?.emoji ?? "📍"}
            highlightedStoreIds={highlightedStoreIds}
            onMarkerPress={setSelectedId}
          />
        ) : (
          bounds && (
            <>
              <MapMarker
                leftPercent={projectToPercent(location.coords.longitude, bounds.minLng, bounds.maxLng)}
                topPercent={projectToPercent(location.coords.latitude, bounds.minLat, bounds.maxLat, true)}
                emoji="●"
                isUser
              />
              {stores.map((store) => (
                <MapMarker
                  key={store.id}
                  leftPercent={projectToPercent(store.longitude, bounds.minLng, bounds.maxLng)}
                  topPercent={projectToPercent(store.latitude, bounds.minLat, bounds.maxLat, true)}
                  emoji={categoryInfo?.emoji ?? "📍"}
                  selected={highlightedStoreIds.includes(store.id)}
                  onPress={() => setSelectedId(store.id)}
                />
              ))}
            </>
          )
        )}
        {location.mode === "manual" && (
          <View
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 11, fontFamily: "Pretendard-SemiBold" }}>
              📍 {location.manualLabel} 기준
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
      >
        {CATEGORIES.map((c) => (
          <Chip
            key={c.key}
            label={c.label}
            icon={c.emoji}
            selected={c.key === category}
            accentColor={categoryColors[c.key].accent}
            accentTint={categoryColors[c.key].tint}
            onPress={() => {
              if (c.key !== category) router.replace(`/map/${c.key}`);
            }}
          />
        ))}
      </ScrollView>

      {!isLoading && recommendation && (
        <RecommendationCard
          recommendation={recommendation}
          onPress={() => router.push(`/store/${recommendation.store.id}`)}
        />
      )}

      {!isLoading && stores.length === 0 && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 }}>
          <Text style={{ fontSize: 15, color: colors.textSecondary }}>주변에 표시할 가게가 없어요.</Text>
        </View>
      )}

      {isLoading ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
          <StoreListItemSkeleton />
          <StoreListItemSkeleton />
          <StoreListItemSkeleton />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}
          data={stores}
          keyExtractor={(item: StoreWithDistance) => item.id}
          renderItem={({ item }) => (
            <StoreListItem
              store={item}
              isRecommended={recommendation?.store.id === item.id}
              onPress={() => router.push(`/store/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}
