import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocation } from "../hooks/useLocation";
import { geocodeArea } from "../services/api";

export default function LocationSearchScreen() {
  const router = useRouter();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    const result = await geocodeArea(query);
    setLoading(false);
    if (!result) {
      setError("일치하는 지역을 찾지 못했어요. 다른 이름으로 시도해보세요. (예: 강남, 홍대, 이태원)");
      return;
    }
    location.setManualLocation(result.coords, result.label);
    router.replace("/category");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>어느 지역을 찾고 있나요?</Text>
      <Text style={styles.subtitle}>동/역 이름을 입력하면 해당 지역 기준으로 추천해드려요</Text>

      <TextInput
        style={styles.input}
        placeholder="예: 강남역, 홍대, 이태원"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
        autoFocus
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSearch} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>이 지역으로 검색하기</Text>}
      </Pressable>

      <Pressable onPress={() => router.push("/")}>
        <Text style={styles.link}>위치 권한을 다시 허용할래요</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 8,
  },
  error: {
    color: "#d64545",
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#ff6b35",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  link: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
  },
});
