import { View } from "react-native";
import { useTheme } from "../constants/theme";
import { Card } from "./ui/Card";
import { Skeleton } from "./ui/Skeleton";

export function StoreListItemSkeleton() {
  const { spacing, radius } = useTheme();

  return (
    <Card style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.md }}>
      <Skeleton width={52} height={52} radius={radius.md} />
      <View style={{ flex: 1, gap: spacing.sm }}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} />
        <View style={{ flexDirection: "row", gap: spacing.xs }}>
          <Skeleton width={50} height={18} radius={radius.sm} />
          <Skeleton width={50} height={18} radius={radius.sm} />
        </View>
      </View>
    </Card>
  );
}
