import { AISDKError } from "ai";

export interface ApiError {
  message: string;
  code?: string | number;
}

export type ChatError = ApiError;

/**
 * Converts any error into a standardized ChatError format
 */
export function normalizeChatError(error: unknown): ChatError {
  // Handle wrapped errors
  if (typeof error === "object" && error !== null && "error" in error) {
    error = (error as { error: unknown }).error;
  }

  // Handle AI SDK Error
  if (error instanceof AISDKError) {
    return {
      message: error.message,
    };
  }

  // Handle other Error types
  if (error instanceof Error) {
    // Handle AbortError specifically
    if (error.name === "AbortError") {
      return {
        message: "Request was cancelled by the user.",
      };
    }

    // Return the original error message
    return {
      message: error.message,
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      message: error,
    };
  }

  // Fallback
  return {
    message: "An unexpected error occurred. Please try again.",
  };
}

/**
 * Creates a standardized error object for the message store
 */
export function createErrorMessage(error: unknown): { error: ChatError } {
  const chatError = normalizeChatError(error);
  return { error: chatError };
}

/**
 * Gets display-friendly error information
 */
export function getErrorDisplayInfo(error: ChatError) {
  return {
    title: "Error",
    message: error.message,
    code: error.code,
  };
}
