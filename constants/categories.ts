import type { Category } from "../services/types";

export const CATEGORIES: { key: Category; label: string; emoji: string }[] = [
  { key: "맛집", label: "맛집", emoji: "🍽️" },
  { key: "편의점", label: "편의점", emoji: "🏪" },
  { key: "백화점", label: "백화점", emoji: "🏬" },
  { key: "카페", label: "카페", emoji: "☕" },
];
