import { Text, View } from "react-native";
import { useTheme } from "../constants/theme";
import type { Recommendation } from "../services/types";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

type Props = {
  recommendation: Recommendation;
  onPress: () => void;
};

function sourceLabel(source: string): string {
  if (source.startsWith("review_summary:")) return `리뷰: ${source.split(":")[1]}`;
  if (source.startsWith("context:")) {
    const type = source.split(":")[1];
    if (type === "busy_time") return "지금 혼잡도";
    if (type === "weather_fit") return "날씨 맥락";
    if (type === "weekday_pattern") return "요일 패턴";
  }
  return source;
}

export function RecommendationCard({ recommendation, onPress }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const evidenceCount = recommendation.reasonSources.length;

  return (
    <Card
      onPress={onPress}
      style={{
        backgroundColor: colors.cardDark,
        borderColor: "transparent",
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
        <Text style={[typography.captionMedium, { color: colors.primary }]}>지금 이 순간, 이 가게 어때요?</Text>
        {evidenceCount > 1 && <Badge label={`근거 ${evidenceCount}개 겹침`} tone="dark" />}
      </View>

      <Text style={[typography.headline, { color: colors.onCardDark, marginBottom: spacing.md }]}>
        {recommendation.store.name}
      </Text>

      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.08)",
          borderLeftWidth: 3,
          borderLeftColor: colors.primary,
          borderRadius: radius.sm,
          padding: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <Text style={[typography.body, { color: colors.onCardDarkMuted, lineHeight: 21 }]}>
          “{recommendation.reasonText}”
        </Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
        {recommendation.reasonSources.map((source) => (
          <Badge key={source} label={sourceLabel(source)} tone="dark" />
        ))}
      </View>
    </Card>
  );
}
