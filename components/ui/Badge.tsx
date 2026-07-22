import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../constants/theme";

type Props = {
  label: string;
  tone?: "neutral" | "primary" | "dark";
  color?: string;
  tint?: string;
};

export function Badge({ label, tone = "neutral", color, tint }: Props) {
  const { colors, typography, spacing, radius } = useTheme();

  const toneStyle =
    tone === "primary"
      ? { backgroundColor: tint ?? colors.primaryTint, textColor: color ?? colors.primary }
      : tone === "dark"
        ? { backgroundColor: "rgba(255,255,255,0.14)", textColor: colors.onCardDark }
        : { backgroundColor: colors.surfaceAlt, textColor: colors.textSecondary };

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: toneStyle.backgroundColor,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: 3,
        },
      ]}
    >
      <Text style={[typography.micro, { color: toneStyle.textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
  },
});
