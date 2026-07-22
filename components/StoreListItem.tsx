import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StoreWithDistance } from "../services/types";

type Props = {
  store: StoreWithDistance;
  isRecommended?: boolean;
  onPress: () => void;
};

export function StoreListItem({ store, isRecommended, onPress }: Props) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.name}>{store.name}</Text>
        {isRecommended && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>추천</Text>
          </View>
        )}
      </View>
      <Text style={styles.meta}>
        ⭐ {store.avgRating.toFixed(1)} ({store.reviewCount}) · {(store.distanceMeters / 1000).toFixed(1)}km
      </Text>
      <View style={styles.tags}>
        {store.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  badge: {
    backgroundColor: "#FFEDE3",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: "#ff6b35",
    fontSize: 11,
    fontWeight: "700",
  },
  meta: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: "#F3F3F4",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 12,
    color: "#555",
  },
});
