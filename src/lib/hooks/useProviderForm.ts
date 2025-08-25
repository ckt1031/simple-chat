import { useForm } from "react-hook-form";
import { z } from "zod/mini";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  useProviderStore,
  BaseProviderState,
  CustomProviderState,
} from "@/lib/stores/provider";
import { useUIStore } from "@/lib/stores/ui";
import { defaultProviderConfig } from "@/lib/api/sdk";

const FormSchema = z.object({
  displayName: z.optional(z.string()),
  apiBaseURL: z.optional(z.union([z.url(), z.literal("")])),
  apiKey: z.optional(z.string()),
});

type FormValues = z.infer<typeof FormSchema>;

interface UseProviderFormProps {
  providerId: string;
  onSuccess?: () => void;
}

export function useProviderForm({
  providerId,
  onSuccess,
}: UseProviderFormProps) {
  const { getProvider, updateProvider, removeProvider } = useProviderStore();
  const provider = getProvider(providerId);

  const openDeleteConfirmation = useUIStore((s) => s.openDeleteConfirmation);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isCustom = provider?.type === "custom";
  const defaultBaseURL =
    provider?.type === "official"
      ? defaultProviderConfig[provider.provider]?.apiBaseURL || ""
      : "";

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      displayName: isCustom
        ? (provider as CustomProviderState)?.displayName
        : undefined,
      apiBaseURL: provider?.apiBaseURL || "",
      apiKey: provider?.apiKey || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!provider) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updates: Partial<BaseProviderState> = {
        apiBaseURL: values.apiBaseURL ?? "",
        apiKey: values.apiKey ?? "",
      };

      if (isCustom) {
        (updates as Partial<CustomProviderState>).displayName =
          values.displayName ?? (provider as CustomProviderState).displayName;
      }

      updateProvider(providerId, updates);

      // Reset form to clear dirty state
      form.reset(values);
      setSaveSuccess(true);

      // Clear success message after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);

      onSuccess?.();
    } catch (error) {
      console.error("Failed to save provider:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (isCustom) {
      openDeleteConfirmation(
        "Delete Provider",
        `Are you sure you want to delete "${provider?.displayName || "this provider"}"? This action cannot be undone.`,
        () => {
          removeProvider(providerId);
          onSuccess?.();
        },
      );
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    handleDelete,
    isCustom,
    defaultBaseURL,
    provider,
    isSubmitting: isSaving,
    isDirty: form.formState.isDirty,
    isSaving,
    saveSuccess,
    errors: form.formState.errors,
  };
}
