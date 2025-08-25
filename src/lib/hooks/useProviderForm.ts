import { useForm } from "react-hook-form";
import { z } from "zod/mini";
import { zodResolver } from "@hookform/resolvers/zod";
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

  const onSubmit = (values: FormValues) => {
    if (!provider) return;

    const updates: Partial<BaseProviderState> = {
      apiBaseURL: values.apiBaseURL ?? "",
      apiKey: values.apiKey ?? "",
    };

    if (isCustom) {
      (updates as Partial<CustomProviderState>).displayName =
        values.displayName ?? (provider as CustomProviderState).displayName;
    }

    updateProvider(providerId, updates);
    onSuccess?.();
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
    isSubmitting: form.formState.isSubmitting,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors,
  };
}
