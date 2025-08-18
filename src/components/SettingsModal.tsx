'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useChatStore, type AIProvider } from '@/lib/stores/global';
import { cn } from '@/lib/utils';

// Helper functions moved from ai-providers
const getDefaultModels = (type: AIProvider['type']) => {
  switch (type) {
    case 'openai':
      return [
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
      ];
    case 'google':
      return [
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        { value: 'gemini-pro', label: 'Gemini Pro' },
      ];
    case 'anthropic':
      return [
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
        { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
      ];
    default:
      return [];
  }
};

const getProviderConfig = (type: AIProvider['type']) => {
  switch (type) {
    case 'openai':
      return {
        name: 'OpenAI',
        defaultBaseUrl: 'https://api.openai.com/v1',
        requiresApiKey: true,
        requiresBaseUrl: false,
      };
    case 'google':
      return {
        name: 'Google (Gemini)',
        defaultBaseUrl: 'https://generativelanguage.googleapis.com',
        requiresApiKey: true,
        requiresBaseUrl: false,
      };
    case 'anthropic':
      return {
        name: 'Anthropic (Claude)',
        defaultBaseUrl: 'https://api.anthropic.com',
        requiresApiKey: true,
        requiresBaseUrl: false,
      };
    default:
      return {
        name: 'Unknown',
        defaultBaseUrl: '',
        requiresApiKey: true,
        requiresBaseUrl: false,
      };
  }
};

export function SettingsModal() {
  const { settings, updateSettings, addProvider, updateProvider, deleteProvider, ui, closeSettings } = useChatStore();
  const [activeTab, setActiveTab] = useState('general');
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);

  const handleAddProvider = () => {
    const newProvider: AIProvider = {
      id: crypto.randomUUID(),
      name: 'New Provider',
      type: 'openai',
      apiKey: '',
      model: 'gpt-4o',
      enabled: true,
    };
    addProvider(newProvider);
    setEditingProvider(newProvider);
  };

  const handleUpdateProvider = (id: string, updates: Partial<AIProvider>) => {
    updateProvider(id, updates);
  };

  const handleDeleteProvider = (id: string) => {
    deleteProvider(id);
    if (editingProvider?.id === id) {
      setEditingProvider(null);
    }
  };

  if (!ui.isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 rounded-l-lg">
          <div className="pt-2 px-2">
            <button
              onClick={closeSettings}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-2 space-y-1">
            {[
              { id: 'general', label: 'General' },
              { id: 'providers', label: 'AI Providers' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                  activeTab === tab.id
                    ? "bg-neutral-200 text-neutral-800"
                    : "text-neutral-700 hover:bg-neutral-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">General Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <select
                      value={settings.theme}
                      onChange={(e) => updateSettings({ theme: e.target.value as any })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'providers' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">AI Providers</h3>
                  <button
                    onClick={handleAddProvider}
                    className="flex items-center space-x-2 px-4 py-2 bg-neutral-800 text-neutral-100 rounded-lg hover:bg-neutral-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Provider</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {settings.providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="border border-gray-200 rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={provider.enabled}
                            onChange={(e) => handleUpdateProvider(provider.id, { enabled: e.target.checked })}
                            className="rounded border-neutral-300 text-neutral-600 focus:ring-neutral-500"
                          />
                          <input
                            type="text"
                            value={provider.name}
                            onChange={(e) => handleUpdateProvider(provider.id, { name: e.target.value })}
                            className="text-sm font-medium border-0 focus:ring-0 focus:outline-none"
                            placeholder="Provider name"
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteProvider(provider.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <select
                            value={provider.type}
                            onChange={(e) => handleUpdateProvider(provider.id, {
                              type: e.target.value as any,
                              model: getDefaultModels(e.target.value as any)[0]?.value || ''
                            })}
                            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
                          >
                            <option value="openai">OpenAI</option>
                            <option value="google">Google (Gemini)</option>
                            <option value="anthropic">Anthropic (Claude)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Model
                          </label>
                          <select
                            value={provider.model}
                            onChange={(e) => handleUpdateProvider(provider.id, { model: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
                          >
                            {getDefaultModels(provider.type).map((model) => (
                              <option key={model.value} value={model.value}>
                                {model.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={provider.apiKey}
                          onChange={(e) => handleUpdateProvider(provider.id, { apiKey: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your API key"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          API Base URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={provider.apiBaseUrl || ''}
                          onChange={(e) => handleUpdateProvider(provider.id, { apiBaseUrl: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={getProviderConfig(provider.type).defaultBaseUrl}
                        />
                      </div>
                    </div>
                  ))}

                  {settings.providers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No AI providers configured</p>
                      <p className="text-sm">Add a provider to start chatting</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
