
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
  
  // Load data hook
  const {
    loadData,
    isMountedRef,
    cleanupResources
  } = useParticipantsData();
  
  // Set up realtime updates
  const { isLoadingData, loadComplete } = useRealtimeUpdates(loadData);
  
  // Load data on initial mount
  useEffect(() => {
    console.log("useParticipants effect: Setting up and loading initial data");
    isMountedRef.current = true;
    
    // Initial data load
    const initialLoad = async () => {
      try {
        setIsLoading(true);
        await loadData();
        console.log("Initial data loaded successfully");
        toast.success("Data loaded successfully");
      } catch (error) {
        console.error("Error during initial data load:", error);
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
  }, [loadData, isMountedRef, cleanupResources, setIsLoading]);
  
  // Team utilities
  const { getTeamById } = useTeamUtils(teams);

  return {
    participants,
    teams,
    participantActivities,
    isLoading: isLoading || isLoadingData,
    initialLoadAttempted,
    loadData,
    getTeamById
  };
};
