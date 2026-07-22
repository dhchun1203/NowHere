import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Recommendation } from "../services/types";

type Props = {
  recommendation: Recommendation;
  onPress: () => void;
};

function sourceLabel(source: string): string {
  if (source.startsWith("review_summary:")) return `리뷰: ${source.split(":")[1]}`;
  if (source.startsWith("context:")) {
    const type = source.split(":")[1];
    if (type === "busy_time") return "지금 혼잡도";
    if (type === "weather_fit") return "날씨 맥락";
    if (type === "weekday_pattern") return "요일 패턴";
  }
  return source;
}

export function RecommendationCard({ recommendation, onPress }: Props) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Text style={styles.label}>지금 이 순간, 이 가게 어때요?</Text>
      <Text style={styles.name}>{recommendation.store.name}</Text>
      <Text style={styles.reason}>{recommendation.reasonText}</Text>
      <View style={styles.sources}>
        {recommendation.reasonSources.map((source) => (
          <View key={source} style={styles.sourceTag}>
            <Text style={styles.sourceText}>{sourceLabel(source)}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  label: {
    color: "#ffb08a",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  name: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 6,
  },
  reason: {
    color: "#e5e5e5",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sources: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  sourceTag: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sourceText: {
    color: "#ffd8bd",
    fontSize: 11,
    fontWeight: "600",
  },
});
