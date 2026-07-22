import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  leftPercent: number;
  topPercent: number;
  emoji: string;
  selected?: boolean;
  isUser?: boolean;
  onPress?: () => void;
};

export function MapMarker({ leftPercent, topPercent, emoji, selected, isUser, onPress }: Props) {
  return (
    <Pressable
      style={[styles.wrapper, { left: `${leftPercent}%`, top: `${topPercent}%` }]}
      onPress={onPress}
      hitSlop={8}
    >
      <View
        style={[
          styles.pin,
          isUser && styles.userPin,
          selected && styles.selectedPin,
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  selectedPin: {
    borderColor: "#ff6b35",
    borderWidth: 2,
    backgroundColor: "#FFF4E5",
  },
  userPin: {
    backgroundColor: "#3478F6",
    borderColor: "#3478F6",
  },
  emoji: {
    fontSize: 15,
  },
});
