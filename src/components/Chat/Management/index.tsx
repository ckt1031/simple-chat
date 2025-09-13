import ChatManagementModalComponent from "./ChatManagementModal";
import { useUIStore } from "@/lib/stores/ui";

export function ChatManagementModal() {
  const isChatManagementOpen = useUIStore((s) => s.isChatManagementOpen);

  return isChatManagementOpen ? <ChatManagementModalComponent /> : null;
}

export { default as ChatList } from "./ChatList";
