import * as Location from "expo-location";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, Linking } from "react-native";
import type { Coordinates } from "../services/types";

export type PermissionState = "checking" | "granted" | "denied" | "undetermined";
export type LocationMode = "gps" | "manual" | "none";

type LocationContextValue = {
  status: PermissionState;
  mode: LocationMode;
  coords: Coordinates | null;
  manualLabel: string | null;
  requestPermission: () => Promise<boolean>;
  openSettings: () => void;
  setManualLocation: (coords: Coordinates, label: string) => void;
  clearManualLocation: () => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

async function readCurrentCoords(): Promise<Coordinates | null> {
  try {
    const position = await Location.getCurrentPositionAsync({});
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return null;
  }
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<PermissionState>("checking");
  const [gpsCoords, setGpsCoords] = useState<Coordinates | null>(null);
  const [manualCoords, setManualCoords] = useState<Coordinates | null>(null);
  const [manualLabel, setManualLabel] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  const refreshPermission = useCallback(async () => {
    const { status: current } = await Location.getForegroundPermissionsAsync();
    if (current === "granted") {
      setStatus("granted");
      const coords = await readCurrentCoords();
      if (coords) setGpsCoords(coords);
    } else if (current === "denied") {
      setStatus("denied");
    } else {
      setStatus("undetermined");
    }
  }, []);

  useEffect(() => {
    refreshPermission();
  }, [refreshPermission]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (appState.current !== "active" && next === "active") {
        refreshPermission();
      }
      appState.current = next;
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  const requestPermission = useCallback(async () => {
    const { status: result } = await Location.requestForegroundPermissionsAsync();
    if (result === "granted") {
      setStatus("granted");
      const coords = await readCurrentCoords();
      if (coords) setGpsCoords(coords);
      return true;
    }
    setStatus("denied");
    return false;
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const setManualLocation = useCallback((coords: Coordinates, label: string) => {
    setManualCoords(coords);
    setManualLabel(label);
  }, []);

  const clearManualLocation = useCallback(() => {
    setManualCoords(null);
    setManualLabel(null);
  }, []);

  const mode: LocationMode = status === "granted" && gpsCoords ? "gps" : manualCoords ? "manual" : "none";
  const coords = mode === "gps" ? gpsCoords : mode === "manual" ? manualCoords : null;

  const value: LocationContextValue = {
    status,
    mode,
    coords,
    manualLabel,
    requestPermission,
    openSettings,
    setManualLocation,
    clearManualLocation,
  };

  return React.createElement(LocationContext.Provider, { value }, children);
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within a LocationProvider");
  return ctx;
}
