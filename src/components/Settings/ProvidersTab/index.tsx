"use client";

import { Suspense, useMemo } from "react";
import { OfficialProvider } from "@/lib/stores/provider";
import { useNavigationStore } from "@/lib/stores/navigation";
import dynamic from "next/dynamic";
import ProviderList from "./ProviderList";

const AddCustom = dynamic(() => import("./AddCustom"));
const ProviderConfig = dynamic(() => import("./ProviderConfig"));
const ModelsManager = dynamic(() => import("./ProviderModels"));

export default function ProviderSettingsTab() {
  const { view, activeProviderId, navigateToList } = useNavigationStore();

  const officialList = useMemo(
    () => [
      { id: OfficialProvider.OPENAI, label: "OpenAI" },
      { id: OfficialProvider.GOOGLE, label: "Google" },
      { id: OfficialProvider.OPENROUTER, label: "OpenRouter" },
    ],
    [],
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="space-y-6">
        {view === "list" && <ProviderList officialList={officialList} />}

        {view === "add-custom" && (
          <AddCustom officialList={officialList} onBack={navigateToList} />
        )}

        {view === "configure" && activeProviderId && (
          <ProviderConfig
            providerId={activeProviderId}
            onBack={navigateToList}
          />
        )}

        {view === "manage-models" && activeProviderId && (
          <ModelsManager
            providerId={activeProviderId}
            onBack={navigateToList}
          />
        )}
      </div>
    </Suspense>
  );
}
