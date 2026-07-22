import { Pressable, StyleSheet, Text, View } from "react-native";
import { CATEGORIES } from "../constants/categories";
import type { Category } from "../services/types";

type Props = {
  onSelect: (category: Category) => void;
};

export function CategoryGrid({ onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((c) => (
        <Pressable key={c.key} style={styles.card} onPress={() => onSelect(c.key)}>
          <Text style={styles.emoji}>{c.emoji}</Text>
          <Text style={styles.label}>{c.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  card: {
    width: "47%",
    aspectRatio: 1.1,
    backgroundColor: "#F7F7F8",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emoji: {
    fontSize: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
});
