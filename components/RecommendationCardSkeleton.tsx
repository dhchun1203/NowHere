import { Text, View } from "react-native";
import { useTheme } from "../constants/theme";
import { Card } from "./ui/Card";
import { ThinkingIndicator } from "./ui/ThinkingIndicator";

export function RecommendationCardSkeleton() {
  const { colors, typography, spacing } = useTheme();

  return (
    <Card
      style={{
        backgroundColor: colors.cardDark,
        borderColor: "transparent",
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        minHeight: 130,
        justifyContent: "center",
      }}
    >
      <Text style={[typography.captionMedium, { color: colors.primary, marginBottom: spacing.md }]}>
        지금 이 순간, 이 가게 어때요?
      </Text>
      <ThinkingIndicator textColor={colors.onCardDarkMuted} />
    </Card>
  );
}
