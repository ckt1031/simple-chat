"use client";

import { useEffect, useState } from "react";
import { useConversationStore } from "@/lib/stores/conversation";
import { useGlobalStore } from "@/lib/stores/global";
import { GlobalLoading } from "./GlobalLoading";

interface AppInitializerProps {
  children: React.ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [startTime] = useState(Date.now());
  const isConversationHydrated = useConversationStore(
    (state) => state.isHydrated,
  );
  const isGlobalHydrated = useGlobalStore((state) => state.ui.isHydrated);

  useEffect(() => {
    // Check if both stores are hydrated
    if (isConversationHydrated && isGlobalHydrated) {
      const elapsed = Date.now() - startTime;
      const minLoadingTime = 800; // Minimum 800ms loading time for smooth UX

      if (elapsed >= minLoadingTime) {
        setIsInitialized(true);
      } else {
        // Wait for the remaining time to complete the minimum loading duration
        const timer = setTimeout(() => {
          setIsInitialized(true);
        }, minLoadingTime - elapsed);

        return () => clearTimeout(timer);
      }
    }
  }, [isConversationHydrated, isGlobalHydrated, startTime]);

  // Show loading screen while stores are being hydrated
  if (!isInitialized) {
    return <GlobalLoading />;
  }

  return <>{children}</>;
}
