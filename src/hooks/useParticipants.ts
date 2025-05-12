
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
    isMountedRef.current = true;
    loadData();
    
    // When component unmounts
    return () => {
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
