
import { useState } from "react";
import { toast } from "sonner";

/**
 * Hook for managing participant data refresh functionality
 */
export const useParticipantRefresh = (loadData: (forceFresh: boolean) => Promise<any>) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Retry loading function for manual refresh
  const retryLoading = async () => {
    setLoadError(null);
    setRefreshing(true);
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    try {
      console.log(`Retry attempt ${newRetryCount}`);
      toast.info("Checking connection and refreshing data...");
      
      // Use a longer timeout for later retry attempts
      const timeoutMs = Math.min(15000, 5000 * Math.pow(1.5, Math.min(newRetryCount, 5)));
      
      // Create a promise with timeout
      const loadWithTimeout = async () => {
        return new Promise(async (resolve, reject) => {
          // Set up timeout
          const timeoutId = setTimeout(() => {
            reject(new Error("Request timed out"));
          }, timeoutMs);
          
          try {
            // Force a fresh load with cache-busting
            const result = await loadData(true);
            clearTimeout(timeoutId);
            resolve(result);
          } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
          }
        });
      };
      
      // Execute the load with timeout
      await loadWithTimeout();
      
      toast.success("Data refreshed successfully");
      setLoadError(null);
    } catch (error) {
      console.error("Manual retry failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load data";
      
      const isNetworkError = 
        (error instanceof Error && (
          errorMessage.toLowerCase().includes('failed to fetch') ||
          errorMessage.toLowerCase().includes('network') ||
          errorMessage.toLowerCase().includes('timeout') ||
          errorMessage.toLowerCase().includes('abort')
        )) || !navigator.onLine;
      
      // Provide more specific error messages based on retry count and error type
      if (newRetryCount >= 3) {
        if (isNetworkError) {
          setLoadError(new Error(`Network connectivity issue. Please check your connection and try again later.`));
          toast.error("Connection issues persist. Please check your internet connection.");
        } else {
          setLoadError(new Error(`Still having trouble connecting. ${errorMessage}`));
          toast.error("Still encountering connection issues. Try again later.");
        }
      } else {
        if (isNetworkError) {
          setLoadError(new Error("Network connectivity issue. Please check your internet connection."));
          toast.error("Network connection problem. Please check your internet connection.");
        } else {
          setLoadError(error instanceof Error ? error : new Error("Failed to load data"));
          toast.error("Failed to refresh data. Retrying may help.");
        }
      }
    } finally {
      setRefreshing(false);
    }
  };
  
  return {
    refreshing,
    setRefreshing,
    loadError,
    setLoadError,
    retryLoading,
    retryCount
  };
};
