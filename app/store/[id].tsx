import { Stack, useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, Linking, ScrollView, Text, View } from "react-native";
import { CATEGORIES } from "../../constants/categories";
import { categoryColors, useTheme } from "../../constants/theme";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useStoreDetail, useStoreReviewSummaries } from "../../hooks/useNearbyStores";

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: store, isLoading } = useStoreDetail(id);
  const { data: reviewSummaries } = useStoreReviewSummaries(id);
  const { colors, typography, spacing, radius } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 15, color: colors.textSecondary }}>가게 정보를 찾을 수 없어요.</Text>
      </View>
    );
  }

  const categoryInfo = CATEGORIES.find((c) => c.key === store.category);
  const tone = categoryColors[store.category];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <Stack.Screen options={{ title: store.name }} />

      <View style={{ height: 160, backgroundColor: tone.tint, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 56 }}>{categoryInfo?.emoji ?? "📍"}</Text>
      </View>

      <View style={{ marginTop: spacing.lg, marginHorizontal: spacing.xl }}>
        <Text style={[typography.headline, { color: colors.textPrimary }]}>{store.name}</Text>
        {store.reviewCount > 0 && (
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 6 }]}>
            ⭐ {store.avgRating.toFixed(1)} · 리뷰 {store.reviewCount}개
          </Text>
        )}

        {store.kakaoPlaceUrl && (
          <View style={{ marginTop: spacing.md, alignSelf: "flex-start" }}>
            <Button label="카카오맵에서 평점·리뷰 보기 →" variant="secondary" onPress={() => Linking.openURL(store.kakaoPlaceUrl!)} />
          </View>
        )}

        {store.tags.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md }}>
            {store.tags.map((tag) => (
              <Badge key={tag} label={tag} />
            ))}
          </View>
        )}
      </View>

      {reviewSummaries && reviewSummaries.length > 0 && (
        <Section title="리뷰 요약" spacing={spacing}>
          <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: spacing.md }]}>
            블로그 리뷰 {reviewSummaries.length}개 특징을 요약했어요 (원문 그대로가 아닌 AI 요약)
          </Text>
          <View style={{ gap: spacing.sm }}>
            {reviewSummaries.map((r) => (
              <View
                key={r.id}
                style={{
                  backgroundColor: colors.surface,
                  borderLeftWidth: 3,
                  borderLeftColor: tone.accent,
                  borderRadius: radius.sm,
                  padding: spacing.md,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <Badge label={r.attribute} color={tone.accent} tint={tone.tint} tone="primary" />
                  <Text style={[typography.micro, { color: colors.textTertiary }]}>
                    언급 {Math.round(r.mentionRatio * 100)}%
                  </Text>
                </View>
                <Text style={[typography.body, { color: colors.textSecondary }]}>“{r.samplePhrase}”</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      <Section title="주소" spacing={spacing}>
        <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 20 }]}>{store.address}</Text>
      </Section>

      <Section title="전화번호" spacing={spacing}>
        <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 20 }]}>{store.phone || "정보 없음"}</Text>
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  children,
  spacing,
}: {
  title: string;
  children: ReactNode;
  spacing: ReturnType<typeof useTheme>["spacing"];
}) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ marginTop: spacing.xxl, marginHorizontal: spacing.xl }}>
      <Text style={[typography.title, { color: colors.textPrimary, marginBottom: spacing.md }]}>{title}</Text>
      {children}
    </View>
  );
}
