
import { useEffect, useState } from "react";
import { useParticipantData } from "./participants/useParticipantData";
import { useTeamUtils } from "./participants/useTeamUtils";
import { useRealtimeUpdates } from "./participants/useRealtimeUpdates";
import { useParticipantsData } from "./participants/useParticipantsData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Main hook for managing participants, their activities, and teams
 */
export const useParticipants = () => {
  const {
    participants,
    teams,
    participantActivities,
    isLoading,
    setIsLoading
  } = useParticipantData();
  
  // Additional state to track if initial loading attempt completed
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  // Load data hook
  const {
    loadData,
    isMountedRef,
    cleanupResources
  } = useParticipantsData();
  
  // Set up realtime updates
  const { isLoadingData } = useRealtimeUpdates(loadData);

  // Verify Supabase connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("Checking Supabase connection...");
        const { data, error } = await supabase.from('teams').select('count');
        
        if (error) {
          console.error("Supabase connection error:", error);
          toast.error(`Database connection error: ${error.message}`);
          setLoadError(new Error(`Database connection error: ${error.message}`));
        } else {
          console.log("Supabase connection successful:", data);
        }
      } catch (err) {
        console.error("Failed to check Supabase connection:", err);
        toast.error("Failed to connect to database");
        setLoadError(new Error("Failed to connect to database"));
      }
    };
    
    checkConnection();
  }, []);
  
  // Load data on initial mount with auto-retry
  useEffect(() => {
    console.log("useParticipants effect: Setting up and loading initial data");
    isMountedRef.current = true;
    
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
            setLoadAttempts(prev => prev + 1);
            const retryDelay = loadAttempts === 0 ? 1000 : 3000; // Progressive retry
            setTimeout(() => {
              console.log(`Retry attempt ${loadAttempts + 1} after ${retryDelay}ms`);
              loadData(true);
            }, retryDelay);
          }
        }
      } catch (error) {
        console.error("Error during initial data load:", error);
        setLoadError(error instanceof Error ? error : new Error("Unknown error"));
        toast.error("Failed to load participant data");
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
      cleanupResources();
    };
  }, [loadData, isMountedRef, cleanupResources, setIsLoading, participants.length, teams.length, loadAttempts]);
  
  // Team utilities
  const { getTeamById } = useTeamUtils(teams);
  
  // Retry loading function for manual refresh
  const retryLoading = async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      await loadData(true);
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Manual retry failed:", error);
      setLoadError(error instanceof Error ? error : new Error("Failed to load data"));
      toast.error("Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    participants,
    teams,
    participantActivities,
    isLoading: isLoading || isLoadingData,
    initialLoadAttempted,
    loadError,
    loadData,
    getTeamById,
    retryLoading // Export the retry function
  };
};
