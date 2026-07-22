import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocation } from "../hooks/useLocation";

const SLIDES = [
  {
    emoji: "📍",
    title: "지금 여기, 가장 좋은 곳",
    body: "주변 가게 중 지금 이 순간 나에게 가장 잘 맞는 한 곳을 추천해요.",
  },
  {
    emoji: "💬",
    title: "이유까지 알려드려요",
    body: "리뷰 요약과 지금 상황(시간대, 날씨)을 함께 근거로 설명해요.",
  },
];

type Step = "slide" | "permission";

export default function OnboardingScreen() {
  const router = useRouter();
  const location = useLocation();
  const [step, setStep] = useState<Step>("slide");
  const [slideIndex, setSlideIndex] = useState(0);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (location.status === "granted") {
      router.replace("/category");
    }
  }, [location.status]);

  const goNextSlide = () => {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      setStep("permission");
    }
  };

  const skip = () => setStep("permission");

  const handleAllow = async () => {
    setRequesting(true);
    const granted = await location.requestPermission();
    setRequesting(false);
    if (granted) {
      router.replace("/category");
    } else {
      router.replace("/location-search");
    }
  };

  if (step === "permission") {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emoji}>🧭</Text>
          <Text style={styles.title}>위치 권한이 필요해요</Text>
          <Text style={styles.body}>
            내 주변 가게를 찾아 추천하려면 위치 정보가 필요해요.{"\n"}
            허용하지 않아도 지역명을 직접 입력해 이용할 수 있어요.
          </Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={handleAllow} disabled={requesting}>
          <Text style={styles.primaryButtonText}>{requesting ? "확인 중..." : "허용하기"}</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/location-search")}>
          <Text style={styles.skipText}>나중에, 직접 지역 입력할게요</Text>
        </Pressable>
      </View>
    );
  }

  const slide = SLIDES[slideIndex];
  return (
    <View style={styles.container}>
      <Pressable style={styles.skipButton} onPress={skip}>
        <Text style={styles.skipText}>스킵</Text>
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === slideIndex && styles.dotActive]} />
        ))}
      </View>
      <Pressable style={styles.primaryButton} onPress={goNextSlide}>
        <Text style={styles.primaryButtonText}>
          {slideIndex < SLIDES.length - 1 ? "다음" : "시작하기"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: "space-between",
  },
  skipButton: {
    alignSelf: "flex-end",
  },
  skipText: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
  },
  dotActive: {
    backgroundColor: "#ff6b35",
  },
  primaryButton: {
    backgroundColor: "#ff6b35",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
