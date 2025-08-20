import { useConversationStore } from '@/lib/stores/conversation';
import { useGlobalStore } from '@/lib/stores/global';

export function useAppInitialized() {
  const isConversationHydrated = useConversationStore((state) => state.isHydrated);
  const isGlobalHydrated = useGlobalStore((state) => state.ui.isHydrated);
  
  return isConversationHydrated && isGlobalHydrated;
}
