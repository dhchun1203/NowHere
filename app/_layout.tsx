import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LocationProvider } from "../hooks/useLocation";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <LocationProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="category" />
            <Stack.Screen name="location-search" />
            <Stack.Screen name="map/[category]" options={{ headerShown: true }} />
            <Stack.Screen name="store/[id]" options={{ headerShown: true, title: "가게 상세" }} />
          </Stack>
        </LocationProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
