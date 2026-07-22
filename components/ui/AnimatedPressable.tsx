import { forwardRef } from "react";
import type { PressableProps, View } from "react-native";
import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  scaleTo?: number;
};

// 탭 시 살짝 눌리는 느낌의 scale 애니메이션을 주는 Pressable. Card/Chip/Button이 공통으로 사용한다.
export const AnimatedPressable = forwardRef<View, Props>(
  ({ scaleTo = 0.96, style, onPressIn, onPressOut, children, ...rest }, ref) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
      <ReanimatedPressable
        ref={ref}
        style={[animatedStyle, style]}
        onPressIn={(e) => {
          scale.value = withSpring(scaleTo, { damping: 16, stiffness: 320 });
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withSpring(1, { damping: 16, stiffness: 320 });
          onPressOut?.(e);
        }}
        {...rest}
      >
        {children}
      </ReanimatedPressable>
    );
  }
);

AnimatedPressable.displayName = "AnimatedPressable";
