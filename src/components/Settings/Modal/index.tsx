import { useGlobalStore } from "@/lib/stores/global";
import SettingsModalComponent from "./SettingsModal";

export function SettingsModal() {
  const isSettingsOpen = useGlobalStore((s) => s.ui.isSettingsOpen);

  return isSettingsOpen ? <SettingsModalComponent /> : null;
}
