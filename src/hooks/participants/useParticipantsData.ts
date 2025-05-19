import { useCallback } from "react";
import { useParticipantData } from "./useParticipantData";
import { useParticipantActivities } from "./useParticipantActivities";
import { useDataLoading } from "./useDataLoading";
import { useLoadingState } from "./useLoadingState";
import { useDataLoadingLogic } from "./useDataLoadingLogic";

/**
 * Hook to handle loading participant data and activities
 */
export const useParticipantsData = () => {
  const {
    loadParticipantsData,
    loadTeamMembersData,
    loadTeamsData,
    loadActivitiesData,
    participants,
    setParticipants,
    teams,
    setTeams,
    participantActivities,
    setParticipantActivities,
    isLoading,
    setIsLoading
  } = useParticipantData();

  const { loadActivitiesForParticipant } = useParticipantActivities();
  
  const {
    isMountedRef,
    loadFailedRef,
    initialLoadCompleteRef,
    isLoadingRef,
    startLoading,
    endLoading,
    cleanupResources
  } = useLoadingState(setIsLoading);
  
  // Use the extracted data loading logic with improved error handling
  const { loadData } = useDataLoadingLogic(
    loadParticipantsData,
    loadTeamMembersData,
    loadTeamsData,
    loadActivitiesData,
    setParticipants,
    setTeams,
    isMountedRef,
    loadFailedRef,
    initialLoadCompleteRef,
    startLoading,
    endLoading,
    loadActivitiesForParticipant,
    setParticipantActivities,
    isLoadingRef
  );

  return {
    loadData,
    participants,
    teams,
    initialLoadCompleteRef,
    isMountedRef,
    loadFailedRef,
    cleanupResources
  };
};
