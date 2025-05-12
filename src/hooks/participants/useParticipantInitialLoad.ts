
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Hook for handling initial data loading logic
 */
export const useParticipantInitialLoad = (
  loadData: (forceFresh: boolean) => Promise<any>,
  setIsLoading: (loading: boolean) => void,
  setLoadError: (error: Error | null) => void,
  setInitialLoadAttempted: (attempted: boolean) => void,
  loadAttempts: number,
  setLoadAttempts: (attempts: number) => void,
  participants: any[],
  teams: any[]
) => {
  // Load data on initial mount with auto-retry
  useEffect(() => {
    console.log("useParticipants effect: Setting up and loading initial data");
    
    // Initial data load
    const initialLoad = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Force a direct fetch from Supabase instead of relying on cached data
        const result = await loadData(true);
        console.log("Initial data loaded successfully, result:", result);
        console.log("Participants count:", participants.length);
        console.log("Teams count:", teams.length);
        
        if (participants.length > 0 || teams.length > 0) {
          toast.success("Data loaded successfully");
        } else {
          console.log("No data found in database or data not yet in state");
          // Try loading again if first attempt shows no data, with increasing delay
          if (loadAttempts < 3) {
            setLoadAttempts(loadAttempts + 1);
            const retryDelay = loadAttempts === 0 ? 1000 : 3000; // Progressive retry
            setTimeout(() => {
              console.log(`Retry attempt ${loadAttempts + 1} after ${retryDelay}ms`);
              loadData(true);
            }, retryDelay);
          }
        }
      } catch (error) {
        console.error("Error during initial data load:", error);
        
        // Check if it's a network connectivity issue
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isNetworkError = errorMessage.toLowerCase().includes('failed to fetch') || 
                              errorMessage.toLowerCase().includes('network') ||
                              errorMessage.toLowerCase().includes('connection');
        
        if (isNetworkError) {
          setLoadError(new Error("Network connectivity issue. Please check your internet connection and try again."));
          toast.error("Unable to connect to the database. Please check your internet connection.");
        } else {
          setLoadError(error instanceof Error ? error : new Error("Unknown error loading data"));
          toast.error("Failed to load participant data");
        }
      } finally {
        setInitialLoadAttempted(true);
        setIsLoading(false);
      }
    };
    
    initialLoad();
    
    // Auto refresh after a delay if needed
    const refreshTimer = setTimeout(() => {
      if (participants.length === 0 && teams.length === 0) {
        console.log("No data loaded after initial attempt, trying forced refresh");
        loadData(true).catch(err => {
          console.error("Auto-refresh failed:", err);
        });
      }
    }, 5000);
    
    // When component unmounts
    return () => {
      console.log("useParticipants cleanup");
      clearTimeout(refreshTimer);
    };
  }, [loadData, setIsLoading, participants.length, teams.length, loadAttempts, setLoadAttempts, setInitialLoadAttempted, setLoadError]);
};
