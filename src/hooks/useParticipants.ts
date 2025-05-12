
import { useEffect } from "react";
import { useParticipantData } from "./participants/useParticipantData";
import { useTeamUtils } from "./participants/useTeamUtils";
import { useRealtimeUpdates } from "./participants/useRealtimeUpdates";
import { useParticipantsData } from "./participants/useParticipantsData";

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
  
  // Load data hook
  const {
    loadData,
    isMountedRef,
    cleanupResources
  } = useParticipantsData();
  
  // Set up realtime updates
  useRealtimeUpdates(loadData);
  
  // Load data on initial mount
  useEffect(() => {
    console.log("useParticipants effect: Setting up and loading initial data");
    isMountedRef.current = true;
    
    // Initial data load
    const initialLoad = async () => {
      try {
        await loadData();
        console.log("Initial data loaded successfully");
      } catch (error) {
        console.error("Error during initial data load:", error);
      }
    };
    
    initialLoad();
    
    // When component unmounts
    return () => {
      console.log("useParticipants cleanup");
      cleanupResources();
    };
  }, [loadData, isMountedRef, cleanupResources]);
  
  // Team utilities
  const { getTeamById } = useTeamUtils(teams);

  return {
    participants,
    teams,
    participantActivities,
    isLoading,
    loadData,
    getTeamById
  };
};
