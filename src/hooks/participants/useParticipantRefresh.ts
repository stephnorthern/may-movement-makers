
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
      // Use a longer timeout for later retry attempts
      const timeoutMs = Math.min(10000, 3000 * Math.pow(1.5, Math.min(newRetryCount, 5)));
      
      // Create a promise that will reject after timeoutMs
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), timeoutMs);
      });
      
      // Race between the actual request and the timeout
      await Promise.race([
        loadData(true), 
        timeoutPromise
      ]);
      
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Manual retry failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load data";
      
      // Provide more specific error messages based on retry count
      if (newRetryCount >= 3) {
        setLoadError(new Error(`Still having trouble connecting. ${errorMessage}`));
        toast.error("Still encountering connection issues. Try again later.");
      } else {
        setLoadError(error instanceof Error ? error : new Error("Failed to load data"));
        toast.error("Failed to refresh data. Retrying may help.");
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
