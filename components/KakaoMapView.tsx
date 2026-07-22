import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import type { Coordinates, StoreWithDistance } from "../services/types";

const KAKAO_JS_KEY = process.env.EXPO_PUBLIC_KAKAO_JS_KEY;

export function isKakaoMapAvailable(): boolean {
  return !!KAKAO_JS_KEY;
}

type Props = {
  userLocation: Coordinates;
  stores: StoreWithDistance[];
  categoryEmoji: string;
  highlightedStoreIds: string[];
  onMarkerPress?: (storeId: string) => void;
};

function escapeForJs(value: string): string {
  return JSON.stringify(value);
}

function buildHtml(
  userLocation: Coordinates,
  stores: StoreWithDistance[],
  categoryEmoji: string,
  highlightedStoreIds: string[]
): string {
  const highlighted = new Set(highlightedStoreIds);

  const markersJs = stores
    .map(
      (store) => `
        (function () {
          var pos = new kakao.maps.LatLng(${store.latitude}, ${store.longitude});
          var el = document.createElement('div');
          el.className = 'marker' + (${highlighted.has(store.id) ? "true" : "false"} ? ' marker-selected' : '');
          el.innerText = ${escapeForJs(categoryEmoji)};
          el.addEventListener('click', function () {
            window.ReactNativeWebView.postMessage(JSON.stringify({ storeId: ${escapeForJs(store.id)} }));
          });
          new kakao.maps.CustomOverlay({ position: pos, content: el, yAnchor: 1.1 }).setMap(map);
        })();
      `
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; }
    .marker {
      font-size: 16px;
      background: #ffffff;
      border: 1.5px solid #ddd;
      border-radius: 16px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .marker-selected {
      border-color: #ff6b35;
      border-width: 2px;
      background: #FFF4E5;
    }
    .user-dot {
      width: 16px;
      height: 16px;
      border-radius: 8px;
      background: #3478F6;
      border: 2px solid #ffffff;
      box-shadow: 0 0 0 2px #3478F6;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function reportError(message) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ mapError: String(message) }));
      }
    }
    window.onerror = function (message) { reportError(message); };
  </script>
  <script
    src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false"
    onerror="reportError('카카오맵 SDK 스크립트 로드 실패 (네트워크 또는 키 오류)')"
  ></script>
  <script>
    setTimeout(function () {
      if (typeof kakao === 'undefined' || !kakao.maps) {
        reportError('카카오맵 SDK가 5초 내에 초기화되지 않음 (도메인 미등록 가능성)');
      }
    }, 5000);
    try {
      kakao.maps.load(function () {
        try {
          var map = new kakao.maps.Map(document.getElementById('map'), {
            center: new kakao.maps.LatLng(${userLocation.latitude}, ${userLocation.longitude}),
            level: 4,
          });
          new kakao.maps.CustomOverlay({
            position: new kakao.maps.LatLng(${userLocation.latitude}, ${userLocation.longitude}),
            content: '<div class="user-dot"></div>',
          }).setMap(map);
          ${markersJs}
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ mapReady: true }));
        } catch (e) {
          reportError('지도 초기화 중 에러: ' + (e && e.message ? e.message : e));
        }
      });
    } catch (e) {
      reportError('kakao.maps.load 호출 실패: ' + (e && e.message ? e.message : e));
    }
  </script>
</body>
</html>`;
}

export function KakaoMapView({ userLocation, stores, categoryEmoji, highlightedStoreIds, onMarkerPress }: Props) {
  const [mapError, setMapError] = useState<string | null>(null);

  const html = useMemo(
    () => buildHtml(userLocation, stores, categoryEmoji, highlightedStoreIds),
    [userLocation.latitude, userLocation.longitude, stores, categoryEmoji, highlightedStoreIds]
  );

  return (
    <View style={styles.container}>
      <WebView
        style={styles.webview}
        originWhitelist={["*"]}
        source={{ html }}
        javaScriptEnabled
        onMessage={(event) => {
          let data: { storeId?: string; mapError?: string; mapReady?: boolean };
          try {
            data = JSON.parse(event.nativeEvent.data);
          } catch {
            return;
          }
          if (typeof data.storeId === "string") onMarkerPress?.(data.storeId);
          if (typeof data.mapError === "string") setMapError(data.mapError);
          if (data.mapReady) setMapError(null);
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
