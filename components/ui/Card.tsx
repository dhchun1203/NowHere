import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../constants/theme";
import { AnimatedPressable } from "./AnimatedPressable";

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
};

export function Card({ children, onPress, style, padded = true }: Props) {
  const { colors, radius, spacing, shadow } = useTheme();
  const cardStyle = [
    styles.base,
    {
      backgroundColor: colors.background,
      borderRadius: radius.lg,
      padding: padded ? spacing.lg : 0,
      borderColor: colors.border,
    },
    shadow.card,
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable style={cardStyle} onPress={onPress}>
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
