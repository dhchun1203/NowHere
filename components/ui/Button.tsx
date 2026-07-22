import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { useTheme } from "../../constants/theme";
import { AnimatedPressable } from "./AnimatedPressable";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = "primary", loading, disabled }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const isPrimary = variant === "primary";

  return (
    <AnimatedPressable
      onPress={disabled || loading ? undefined : onPress}
      style={[
        styles.base,
        {
          backgroundColor: isPrimary ? colors.primary : colors.surface,
          borderRadius: radius.md,
          paddingVertical: spacing.lg - 2,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onPrimary : colors.primary} />
      ) : (
        <Text
          style={[
            typography.bodyMedium,
            { color: isPrimary ? colors.onPrimary : colors.textPrimary, fontFamily: "Pretendard-SemiBold" },
          ]}
        >
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});
