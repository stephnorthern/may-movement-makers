
import { toast } from "@/components/ui/sonner";

export type ApiError = {
  message: string;
  status?: number;
};

export const handleApiError = (error: unknown): ApiError => {
  console.error("API Error:", error);
  
  // Default error message
  let message = "An unexpected error occurred. Please try again.";
  let status: number | undefined = undefined;
  
  // Extract error details based on error type
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'object' && error !== null) {
    // Handle Supabase or other structured errors
    const err = error as any;
    if (err.message) message = err.message;
    if (err.status) status = err.status;
    if (err.error?.message) message = err.error.message;
  }
  
  // Show toast notification for user feedback
  toast.error(message);
  
  return { message, status };
};

// Utility to show loading toast
export const showLoadingToast = (message: string = "Loading...") => {
  return toast.loading(message);
};

// Use this function for custom API error messages
export const formatApiErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as any).message;
  }
  return "An unexpected error occurred";
};
