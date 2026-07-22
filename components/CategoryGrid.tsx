import { Text, View } from "react-native";
import { CATEGORIES } from "../constants/categories";
import { categoryColors, useTheme } from "../constants/theme";
import type { Category } from "../services/types";
import { Card } from "./ui/Card";

type Props = {
  onSelect: (category: Category) => void;
};

export function CategoryGrid({ onSelect }: Props) {
  const { spacing, radius, typography } = useTheme();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, justifyContent: "space-between" }}>
      {CATEGORIES.map((c) => {
        const tone = categoryColors[c.key];
        return (
          <Card
            key={c.key}
            onPress={() => onSelect(c.key)}
            style={{
              width: "47%",
              aspectRatio: 1.1,
              backgroundColor: tone.tint,
              borderColor: "transparent",
              borderRadius: radius.xl,
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
            }}
          >
            <Text style={{ fontSize: 40 }}>{c.emoji}</Text>
            <Text style={[typography.title, { color: tone.accent }]}>{c.label}</Text>
          </Card>
        );
      })}
    </View>
  );
}
