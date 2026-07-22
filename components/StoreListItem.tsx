import { Text, View } from "react-native";
import { CATEGORIES } from "../constants/categories";
import { categoryColors, useTheme } from "../constants/theme";
import type { StoreWithDistance } from "../services/types";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

type Props = {
  store: StoreWithDistance;
  isRecommended?: boolean;
  onPress: () => void;
};

export function StoreListItem({ store, isRecommended, onPress }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const tone = categoryColors[store.category];
  const emoji = CATEGORIES.find((c) => c.key === store.category)?.emoji ?? "📍";

  return (
    <Card onPress={onPress} style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.md }}>
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: radius.md,
          backgroundColor: tone.tint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Text style={[typography.title, { color: colors.textPrimary, flexShrink: 1 }]} numberOfLines={1}>
            {store.name}
          </Text>
          {isRecommended && <Badge label="추천" tone="primary" />}
        </View>

        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          {store.reviewCount > 0 ? `⭐ ${store.avgRating.toFixed(1)} (${store.reviewCount}) · ` : ""}
          {(store.distanceMeters / 1000).toFixed(1)}km
        </Text>

        {store.tags.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm }}>
            {store.tags.map((tag) => (
              <Badge key={tag} label={tag} />
            ))}
          </View>
        )}
      </View>
    </Card>
  );
}
