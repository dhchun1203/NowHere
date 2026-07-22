import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { CategoryGrid } from "../components/CategoryGrid";
import { useTheme } from "../constants/theme";
import { useLocation } from "../hooks/useLocation";
import type { Category } from "../services/types";

export default function CategoryScreen() {
  const router = useRouter();
  const location = useLocation();
  const { colors, typography, spacing, radius } = useTheme();

  const handleSelect = (category: Category) => {
    router.push(`/map/${category}`);
  };

  const showLocationBanner = location.mode !== "gps";
  const locationLabel = location.mode === "manual" ? location.manualLabel : "내 위치 근처";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl }}>
      <Pressable
        onPress={() => router.push("/location-search")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          alignSelf: "flex-start",
          marginTop: spacing.sm,
          paddingVertical: spacing.xs,
        }}
      >
        <Text style={[typography.title, { color: colors.textPrimary }]}>📍 {locationLabel}</Text>
        <Text style={[typography.caption, { color: colors.textTertiary }]}>변경</Text>
      </Pressable>

      {showLocationBanner && (
        <Pressable
          onPress={location.openSettings}
          style={{
            backgroundColor: colors.primaryTint,
            borderRadius: radius.md,
            padding: spacing.md,
            marginTop: spacing.sm,
          }}
        >
          <Text style={[typography.caption, { color: colors.primary }]}>
            위치를 켜면 더 정확한 추천을 받을 수 있어요{" "}
            <Text style={{ fontFamily: "Pretendard-SemiBold", textDecorationLine: "underline" }}>[설정으로 이동]</Text>
          </Text>
        </Pressable>
      )}

      <View style={{ marginTop: spacing.xl, marginBottom: spacing.xxl }}>
        <Text style={[typography.headline, { color: colors.textPrimary, marginBottom: 6 }]}>
          어떤 곳을 찾고 있나요?
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          카테고리를 선택하면 지금 가장 좋은 곳을 추천해드려요
        </Text>
      </View>

      <CategoryGrid onSelect={handleSelect} />
    </SafeAreaView>
  );
}
