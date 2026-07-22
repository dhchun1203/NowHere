import { Stack, useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { CATEGORIES } from "../../constants/categories";
import { useStoreDetail } from "../../hooks/useNearbyStores";
import type { BusinessHours } from "../../services/types";

const DAY_LABELS: { key: keyof BusinessHours; label: string }[] = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
];

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: store, isLoading } = useStoreDetail(id);

  if (isLoading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.emptyText}>가게 정보를 찾을 수 없어요.</Text>
      </View>
    );
  }

  const categoryInfo = CATEGORIES.find((c) => c.key === store.category);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: store.name }} />
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{categoryInfo?.emoji ?? "📍"}</Text>
      </View>
      <Text style={styles.name}>{store.name}</Text>
      <Text style={styles.rating}>
        ⭐ {store.avgRating.toFixed(1)} · 리뷰 {store.reviewCount}개
      </Text>

      <View style={styles.tags}>
        {store.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <Section title="영업시간">
        {DAY_LABELS.map(({ key, label }) => {
          const hours = store.businessHours[key];
          return (
            <View key={key} style={styles.hoursRow}>
              <Text style={styles.hoursDay}>{label}</Text>
              <Text style={styles.hoursValue}>
                {hours ? `${hours.open} - ${hours.close}` : "정보 없음"}
              </Text>
            </View>
          );
        })}
      </Section>

      <Section title="주소">
        <Text style={styles.plainText}>{store.address}</Text>
      </Section>

      <Section title="전화번호">
        <Text style={styles.plainText}>{store.phone}</Text>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    paddingBottom: 40,
  },
  hero: {
    height: 160,
    backgroundColor: "#E9EEF1",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEmoji: {
    fontSize: 56,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
    marginTop: 16,
    marginHorizontal: 20,
  },
  rating: {
    fontSize: 14,
    color: "#777",
    marginTop: 6,
    marginHorizontal: 20,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
    marginHorizontal: 20,
  },
  tag: {
    backgroundColor: "#F3F3F4",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 12,
    color: "#555",
  },
  section: {
    marginTop: 24,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 10,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  hoursDay: {
    fontSize: 13,
    color: "#777",
  },
  hoursValue: {
    fontSize: 13,
    color: "#1a1a1a",
  },
  plainText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#555",
  },
});
