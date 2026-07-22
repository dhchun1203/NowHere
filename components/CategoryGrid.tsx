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
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
      {CATEGORIES.map((c) => {
        const tone = categoryColors[c.key];
        return (
          <Card
            key={c.key}
            onPress={() => onSelect(c.key)}
            style={{
              flexBasis: "48%",
              flexGrow: 1,
              aspectRatio: 1.5,
              backgroundColor: tone.tint,
              borderColor: "transparent",
              borderRadius: radius.xl,
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.xs,
            }}
          >
            <Text style={{ fontSize: 32 }}>{c.emoji}</Text>
            <Text style={[typography.bodyMedium, { color: tone.accent }]}>{c.label}</Text>
          </Card>
        );
      })}
    </View>
  );
}
