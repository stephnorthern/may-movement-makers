
import { useEffect, useState } from "react";
import { useParticipantData } from "./participants/useParticipantData";
import { useTeamUtils } from "./participants/useTeamUtils";
import { useRealtimeUpdates } from "./participants/useRealtimeUpdates";
import { useParticipantsData } from "./participants/useParticipantsData";
import { toast } from "sonner";

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
  
  // Load data hook
  const {
    loadData,
    isMountedRef,
    cleanupResources
  } = useParticipantsData();
  
  // Set up realtime updates
  const { isLoadingData } = useRealtimeUpdates(loadData);
  
  // Load data on initial mount
  useEffect(() => {
    console.log("useParticipants effect: Setting up and loading initial data");
    isMountedRef.current = true;
    
    // Initial data load
    const initialLoad = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Force a direct fetch from Supabase instead of relying on cached data
        await loadData(true);
        console.log("Initial data loaded successfully");
        console.log("Participants count:", participants.length);
        console.log("Teams count:", teams.length);
        
        if (participants.length > 0 || teams.length > 0) {
          toast.success("Data loaded successfully");
        } else {
          console.log("No data found in database");
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
    
    // When component unmounts
    return () => {
      console.log("useParticipants cleanup");
      cleanupResources();
    };
  }, [loadData, isMountedRef, cleanupResources, setIsLoading, participants.length, teams.length]);
  
  // Team utilities
  const { getTeamById } = useTeamUtils(teams);

  return {
    participants,
    teams,
    participantActivities,
    isLoading: isLoading || isLoadingData,
    initialLoadAttempted,
    loadError,
    loadData,
    getTeamById
  };
};
