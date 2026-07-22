import { StyleSheet, Text } from "react-native";
import { useTheme } from "../../constants/theme";
import { AnimatedPressable } from "./AnimatedPressable";

type Props = {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
  accentColor?: string;
  accentTint?: string;
};

export function Chip({ label, icon, selected, onPress, accentColor, accentTint }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const activeColor = accentColor ?? colors.primary;
  const activeTint = accentTint ?? colors.primaryTint;

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        styles.base,
        {
          borderRadius: radius.pill,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          backgroundColor: selected ? activeTint : colors.surface,
          borderColor: selected ? activeColor : colors.border,
        },
      ]}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text
        style={[
          typography.captionMedium,
          { color: selected ? activeColor : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
  },
  icon: {
    fontSize: 15,
  },
});
