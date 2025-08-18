'use client';

import { useMemo, useState } from 'react';
import { OfficialProvider, useProviderStore } from '@/lib/stores/provider';
import ProviderList from './ProviderList';
import AddCustom from './AddCustom';
import ProviderConfig from './ProviderConfig';

type View = 'list' | 'add-custom' | 'configure-official' | 'configure-custom';

export default function ProviderSettingsTab() {
  const {
    officialProviders,
    customProviders,
    addCustomProvider,
  } = useProviderStore();

  const [view, setView] = useState<View>('list');
  const [activeOfficial, setActiveOfficial] = useState<OfficialProvider | null>(null);
  const [activeCustomId, setActiveCustomId] = useState<string | null>(null);

  const officialList = useMemo(() => [
    { id: OfficialProvider.OPENAI, label: 'OpenAI' },
    { id: OfficialProvider.GOOGLE, label: 'Google' },
    { id: OfficialProvider.OPENROUTER, label: 'OpenRouter' },
  ], []);

  function handleAddCustom(format: OfficialProvider) {
    const id = addCustomProvider(format);
    setActiveCustomId(id);
    setView('configure-custom');
  }

  const backToList = () => { setView('list'); setActiveOfficial(null); setActiveCustomId(null); };

  return (
    <div className="space-y-6">
      {view === 'list' && <ProviderList officialList={officialList} setView={setView} setActiveOfficial={setActiveOfficial} setActiveCustomId={setActiveCustomId} />}
      {view === 'add-custom' && (
        <AddCustom
          officialList={officialList}
          onBack={backToList}
          onChoose={(format) => { const id = addCustomProvider(format); setActiveCustomId(id); setView('configure-custom'); }}
        />
      )}
      {view === 'configure-official' && (
        <ProviderConfig isCustom={false} activeOfficial={activeOfficial} activeCustomId={activeCustomId} onBack={backToList} />
      )}
      {view === 'configure-custom' && (
        <ProviderConfig isCustom={true} activeOfficial={activeOfficial} activeCustomId={activeCustomId} onBack={backToList} />
      )}
    </div>
  );
}
