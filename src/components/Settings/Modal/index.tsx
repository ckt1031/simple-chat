import SettingsModalComponent from "./SettingsModal";

import { useGlobalStore } from "@/lib/stores/global";

export function SettingsModal() {
  const isSettingsOpen = useGlobalStore((s) => s.ui.isSettingsOpen);

  return isSettingsOpen ? <SettingsModalComponent /> : null;
}
