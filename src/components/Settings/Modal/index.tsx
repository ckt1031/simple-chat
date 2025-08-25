import SettingsModalComponent from "./SettingsModal";

import { useUIStore } from "@/lib/stores/ui";

export function SettingsModal() {
  const isSettingsOpen = useUIStore((s) => s.isSettingsOpen);

  return isSettingsOpen ? <SettingsModalComponent /> : null;
}
