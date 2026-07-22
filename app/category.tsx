import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { CategoryGrid } from "../components/CategoryGrid";
import { useLocation } from "../hooks/useLocation";
import type { Category } from "../services/types";

export default function CategoryScreen() {
  const router = useRouter();
  const location = useLocation();

  const handleSelect = (category: Category) => {
    router.push(`/map/${category}`);
  };

  const showLocationBanner = location.mode !== "gps";

  return (
    <SafeAreaView style={styles.container}>
      {showLocationBanner && (
        <Pressable style={styles.banner} onPress={location.openSettings}>
          <Text style={styles.bannerText}>
            위치를 켜면 더 정확한 추천을 받을 수 있어요{" "}
            <Text style={styles.bannerLink}>[설정으로 이동]</Text>
          </Text>
        </Pressable>
      )}
      <View style={styles.header}>
        <Text style={styles.title}>어떤 곳을 찾고 있나요?</Text>
        <Text style={styles.subtitle}>카테고리를 선택하면 지금 가장 좋은 곳을 추천해드려요</Text>
      </View>
      <CategoryGrid onSelect={handleSelect} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
  },
  banner: {
    backgroundColor: "#FFF4E5",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  bannerText: {
    color: "#8a5a00",
    fontSize: 13,
  },
  bannerLink: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  header: {
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
});
