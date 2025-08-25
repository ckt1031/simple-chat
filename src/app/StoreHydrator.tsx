"use client";

import { useEffect } from "react";
import { useConversationStore } from "@/lib/stores/conversation";

export default function StoreHydrator() {
  const isHydrated = useConversationStore((s) => s.isHydrated);
  const hydrateFromDB = useConversationStore((s) => s.hydrateFromDB);

  useEffect(() => {
    if (!isHydrated) void hydrateFromDB();
  }, [isHydrated, hydrateFromDB]);

  return null;
}
