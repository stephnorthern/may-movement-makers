
import { useState } from "react";
import { toast } from "sonner";

/**
 * Hook for managing participant data refresh functionality
 */
export const useParticipantRefresh = (loadData: (forceFresh: boolean) => Promise<any>) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  
  // Retry loading function for manual refresh
  const retryLoading = async () => {
    setLoadError(null);
    setRefreshing(true);
    try {
      await loadData(true);
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Manual retry failed:", error);
      setLoadError(error instanceof Error ? error : new Error("Failed to load data"));
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };
  
  return {
    refreshing,
    setRefreshing,
    loadError,
    setLoadError,
    retryLoading
  };
};
