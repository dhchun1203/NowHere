import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useTheme } from "../../constants/theme";

function Dot({ delay, color }: { delay: number; color: string }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 300, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) })
        ),
        -1
      )
    );
  }, [translateY, delay]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, animatedStyle]} />;
}

type Props = {
  label?: string;
  textColor?: string;
};

export function ThinkingIndicator({ label = "지금 딱 맞는 곳을 찾는 중", textColor }: Props) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <Text style={[typography.caption, { color: textColor ?? colors.textSecondary }]}>{label}</Text>
      <View style={styles.dots}>
        <Dot delay={0} color={colors.primary} />
        <Dot delay={120} color={colors.primary} />
        <Dot delay={240} color={colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
