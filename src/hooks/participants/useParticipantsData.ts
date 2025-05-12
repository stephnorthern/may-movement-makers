
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
    startLoading,
    endLoading,
    cleanupResources
  } = useLoadingState(setIsLoading);
  
  // Use the extracted data loading logic
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
    setParticipantActivities
  );

  return {
    loadData,
    initialLoadCompleteRef,
    isMountedRef,
    loadFailedRef,
    cleanupResources
  };
};
