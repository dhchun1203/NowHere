import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import type { Coordinates, StoreWithDistance } from "../services/types";

// 카카오맵 JS SDK는 도메인(Referer) 검증을 하는데, WebView에 source={{ html }}로 직접
// 렌더링하면 origin이 없어 검증에 항상 실패한다(카카오 데브톡 공식 답변 기준).
// 그래서 지도 페이지를 GitHub Pages(docs/kakao-map.html)에 실제로 호스팅해두고,
// 여기서는 그 URL을 불러온 뒤 postMessage로 데이터만 주고받는다.
const KAKAO_MAP_PAGE_URL = process.env.EXPO_PUBLIC_KAKAO_MAP_PAGE_URL;

export function isKakaoMapAvailable(): boolean {
  return !!KAKAO_MAP_PAGE_URL;
}

type Props = {
  userLocation: Coordinates;
  stores: StoreWithDistance[];
  categoryEmoji: string;
  highlightedStoreIds: string[];
  onMarkerPress?: (storeId: string) => void;
};

export function KakaoMapView({ userLocation, stores, categoryEmoji, highlightedStoreIds, onMarkerPress }: Props) {
  const webviewRef = useRef<WebView>(null);
  const [pageReady, setPageReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!pageReady) return;
    webviewRef.current?.postMessage(
      JSON.stringify({
        type: "update",
        userLocation,
        stores: stores.map((s) => ({ id: s.id, latitude: s.latitude, longitude: s.longitude })),
        categoryEmoji,
        highlightedStoreIds,
      })
    );
  }, [pageReady, userLocation.latitude, userLocation.longitude, stores, categoryEmoji, highlightedStoreIds]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        style={styles.webview}
        source={{ uri: KAKAO_MAP_PAGE_URL! }}
        javaScriptEnabled
        onMessage={(event) => {
          let data: { storeId?: string; mapError?: string; pageReady?: boolean };
          try {
            data = JSON.parse(event.nativeEvent.data);
          } catch {
            return;
          }
          if (typeof data.storeId === "string") onMarkerPress?.(data.storeId);
          if (typeof data.mapError === "string") setMapError(data.mapError);
          if (data.pageReady) {
            setMapError(null);
            setPageReady(true);
          }
        }}
        onError={(event) => setMapError(`WebView 로드 실패: ${event.nativeEvent.description}`)}
      />
      {mapError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{mapError}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  errorBox: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(200,40,40,0.92)",
    padding: 10,
  },
  errorText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
