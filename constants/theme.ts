import { useColorScheme } from "react-native";
import type { Category } from "../services/types";

export const fonts = {
  regular: "Pretendard-Regular",
  medium: "Pretendard-Medium",
  semiBold: "Pretendard-SemiBold",
  bold: "Pretendard-Bold",
};

export const typography = {
  display: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 36 },
  headline: { fontFamily: fonts.semiBold, fontSize: 22, lineHeight: 30 },
  title: { fontFamily: fonts.semiBold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  captionMedium: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

// 카테고리별 포인트 컬러. 칩/배지/추천 카드 등에서 카테고리를 시각적으로 구분하는 데 쓴다.
export const categoryColors: Record<Category, { accent: string; tint: string }> = {
  맛집: { accent: "#FF6B4A", tint: "#FFEFEA" },
  카페: { accent: "#B4823D", tint: "#F5EDE1" },
  편의점: { accent: "#4C9AFF", tint: "#E9F1FF" },
  백화점: { accent: "#A56CF2", tint: "#F3EBFF" },
};

const lightColors = {
  background: "#FFFFFF",
  surface: "#F7F7F8",
  surfaceAlt: "#F0F0F1",
  border: "#E5E5E5",
  textPrimary: "#1A1A1A",
  textSecondary: "#666666",
  textTertiary: "#999999",
  primary: "#FF6B35",
  primaryTint: "#FFF4E5",
  onPrimary: "#FFFFFF",
  accent: "#FFD166",
  cardDark: "#1A1A1A",
  onCardDark: "#FFFFFF",
  onCardDarkMuted: "#D8D8D8",
};

const darkColors = {
  background: "#0F0F10",
  surface: "#1C1C1E",
  surfaceAlt: "#232326",
  border: "#2C2C2E",
  textPrimary: "#F5F5F5",
  textSecondary: "#B5B5B5",
  textTertiary: "#7A7A7A",
  primary: "#FF7A47",
  primaryTint: "#3A2A1D",
  onPrimary: "#1A1A1A",
  accent: "#FFD166",
  cardDark: "#000000",
  onCardDark: "#FFFFFF",
  onCardDarkMuted: "#B5B5B5",
};

export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  floating: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};

export function useTheme() {
  const scheme = useColorScheme();
  const colors = scheme === "dark" ? darkColors : lightColors;
  return { colors, isDark: scheme === "dark", typography, spacing, radius, shadow, categoryColors };
}
