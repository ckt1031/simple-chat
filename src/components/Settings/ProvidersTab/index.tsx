"use client";

import { Suspense } from "react";
import { OfficialProvider } from "@/lib/stores/provider";
import { useSettingsProviderNavigationStore } from "@/lib/stores/navigation";
import dynamic from "next/dynamic";
import ProviderList from "./ProviderList";
import Loading from "../Modal/Loading";

const AddCustom = dynamic(() => import("./AddCustom"));
const ProviderConfig = dynamic(() => import("./ProviderConfig"));
const ModelsManager = dynamic(() => import("./ProviderModels"));

const officialList = Object.values(OfficialProvider).map((provider) => ({
  id: provider,
  label: provider,
}));

export default function ProviderSettingsTab() {
  const { view, activeProviderId, navigateToList } =
    useSettingsProviderNavigationStore();

  return (
    <Suspense fallback={<Loading />}>
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
