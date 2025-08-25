import { Message, useConversationStore } from "../stores/conversation";
import { normalizeChatError, ChatError } from "./error-handling";

/**
 * Handles errors that occur during message streaming and updates the conversation store
 */
export function handleStreamingError(
  error: unknown,
  conversationId: string,
  assistantMessageId?: string,
): void {
  const store = useConversationStore.getState();
  const { currentConversationId, currentMessages, addMessage, updateMessage } =
    store;

  // Normalize the error
  const chatError = normalizeChatError(error);

  // Create error message with proper fields
  const errorMessage = createErrorMessageWithFields(chatError);

  // Try to find the last assistant message to attach the error to
  if (currentConversationId === conversationId) {
    const lastMessage = currentMessages[currentMessages.length - 1];

    if (
      lastMessage &&
      lastMessage.role === "assistant" &&
      (assistantMessageId ? lastMessage.id === assistantMessageId : true)
    ) {
      // Update the existing assistant message with the error
      updateMessage(lastMessage.id, errorMessage);
      return;
    }
  }

  // Create a new error message if no suitable assistant message found
  addMessage({
    timestamp: Date.now(),
    role: "assistant",
    content: "",
    ...errorMessage,
  });
}

/**
 * Creates an error message object for the conversation store
 */
function createErrorMessageWithFields(chatError: ChatError): {
  error: Message["error"];
} {
  return {
    error: {
      message: chatError.message,
      code: chatError.code,
    },
  };
}

/**
 * Creates a provider-related error message
 */
export function createProviderError(message: string): Message {
  return {
    id: "", // Will be set by addMessage
    timestamp: Date.now(),
    role: "assistant",
    content: "",
    error: {
      message,
    },
  };
}

/**
 * Creates a no-providers-configured error message
 */
export function createNoProvidersError(): Message {
  return createProviderError(
    "No AI providers configured. Please add a provider in settings.",
  );
}

/**
 * Creates a no-model-selected error message
 */
export function createNoModelError(): Message {
  return createProviderError(
    "No model selected. Please choose a model from the selector above.",
  );
}
