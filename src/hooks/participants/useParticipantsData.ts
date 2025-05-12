
import { useCallback } from "react";
import { Activity } from "@/types";
import { toast } from "sonner";
import { useParticipantData } from "./useParticipantData";
import { useParticipantActivities } from "./useParticipantActivities";
import { useDataLoading } from "./useDataLoading";
import { useLoadingState } from "./useLoadingState";

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
  const { loadParticipantsFallback, loadTeamsFallback, loadActivitiesFallback } = useDataLoading();
  const {
    isMountedRef,
    loadFailedRef,
    initialLoadCompleteRef,
    startLoading,
    endLoading,
    cleanupResources
  } = useLoadingState(setIsLoading);
  
  /**
   * Main data loading function - loads from Supabase with fallbacks to local storage
   * @param forceFresh - Force a fresh fetch, bypassing any caching
   */
  const loadData = useCallback(async (forceFresh = false) => {
    if (!isMountedRef.current) return;
    
    startLoading();
    console.log("Starting data load from Supabase, forceFresh:", forceFresh);
    
    try {
      // Add cache-busting parameter for Supabase when forceFresh is true
      const options = forceFresh ? { head: false } : undefined;
      
      // Load data from Supabase
      const participantsData = await loadParticipantsData(options);
      const teamMembersData = await loadTeamMembersData(options);
      const teamsData = await loadTeamsData(options);
      const activitiesData = await loadActivitiesData(options);
      
      if (!isMountedRef.current) return;
      
      console.log("Data fetched successfully:", {
        participantsCount: participantsData?.length || 0,
        teamMembersCount: teamMembersData?.length || 0,
        teamsCount: teamsData?.length || 0,
        activitiesCount: activitiesData?.length || 0
      });
      
      if (!participantsData || !teamsData) {
        throw new Error("Failed to load essential data");
      }
      
      // Calculate points for each participant
      const participantsWithPoints = participantsData.map(participant => {
        // Find activities for this participant
        const participantActivities = activitiesData?.filter(
          activity => activity.participant_id === participant.id
        ) || [];
        
        // Calculate total points
        const points = participantActivities.reduce((sum, activity) => sum + activity.points, 0);
        
        // Find team association
        const teamMember = teamMembersData?.find(
          tm => tm.participant_id === participant.id
        );
        
        return {
          id: participant.id,
          name: participant.name,
          points: points,
          totalMinutes: participant.total_minutes || 0,
          teamId: teamMember?.team_id
        };
      });
      
      // Sort by points (highest first)
      const sortedData = [...participantsWithPoints].sort((a, b) => b.points - a.points);
      
      if (!isMountedRef.current) return;
      
      console.log("Setting participants data:", sortedData.length);
      setParticipants(sortedData);
      
      console.log("Setting teams data:", teamsData.length);
      setTeams(teamsData);
      
      await loadParticipantActivities(participantsWithPoints);
      
      initialLoadCompleteRef.current = true;
      loadFailedRef.current = false; // Reset failure flag on success
      
      // Loading completed successfully
      console.log("Data loading completed successfully");
      return true;
    } catch (error) {
      if (!isMountedRef.current) return;
      
      console.error("Error loading data:", error);
      
      // Only show toast on first failure to avoid spamming
      if (!loadFailedRef.current) {
        toast.error("Failed to load data, trying fallback method");
        loadFailedRef.current = true;
      }
      
      const fallbackResult = await loadDataFallback();
      return fallbackResult;
    } finally {
      if (isMountedRef.current) {
        endLoading();
      }
    }
  }, [
    loadParticipantsData, 
    loadTeamMembersData, 
    loadTeamsData, 
    loadActivitiesData,
    isMountedRef,
    setParticipants,
    setTeams,
    loadFailedRef,
    startLoading,
    endLoading,
  ]);

  /**
   * Load participant activities for all participants
   */
  const loadParticipantActivities = useCallback(async (participantsData) => {
    if (!isMountedRef.current) return;
    
    // Load activities for each participant
    const activitiesMap: Record<string, Activity[]> = {};
    for (const participant of participantsData) {
      if (!isMountedRef.current) return;
      
      try {
        const activities = await loadActivitiesForParticipant(
          participant.id,
          participant.name
        );
        activitiesMap[participant.id] = activities;
      } catch (e) {
        console.error(`Error processing activities for participant ${participant.id}:`, e);
        activitiesMap[participant.id] = []; // Set empty array when activities fail to load
      }
    }
    
    if (!isMountedRef.current) return;
    
    setParticipantActivities(activitiesMap);
  }, [isMountedRef, loadActivitiesForParticipant, setParticipantActivities]);
  
  /**
   * Fallback method to load data from local storage
   */
  const loadDataFallback = useCallback(async () => {
    try {
      console.log("Attempting fallback data loading method");
      const participantsData = await loadParticipantsFallback();
      const teamsData = await loadTeamsFallback();
      
      if (!isMountedRef.current) return false;
      
      console.log("Fallback data loaded:", {
        participantsCount: participantsData?.length || 0,
        teamsCount: teamsData?.length || 0
      });
      
      if (!participantsData || !teamsData) {
        throw new Error("Failed to load data from fallback");
      }
      
      // Sort by points (highest first)
      const sortedData = [...participantsData].sort((a, b) => b.points - a.points);
      setParticipants(sortedData);
      setTeams(teamsData);
      
      // Load activities for each participant
      const activitiesMap: Record<string, Activity[]> = {};
      for (const participant of participantsData) {
        if (!isMountedRef.current) return false;
        
        try {
          const activities = await loadActivitiesFallback(participant.id);
          activitiesMap[participant.id] = activities;
        } catch (fallbackActivityError) {
          console.error(
            `Error loading activities for participant ${participant.id}:`, 
            fallbackActivityError
          );
          activitiesMap[participant.id] = []; // Set empty array when activities fail to load
        }
      }
      
      if (!isMountedRef.current) return false;
      
      setParticipantActivities(activitiesMap);
      initialLoadCompleteRef.current = true;
      loadFailedRef.current = false; // Reset failure flag on success
      return true;
    } catch (fallbackError) {
      if (!isMountedRef.current) return false;
      
      console.error("Error in fallback loading:", fallbackError);
      
      // Only show toast on first failure to avoid spamming
      if (!loadFailedRef.current) {
        toast.error("All data loading methods failed");
        loadFailedRef.current = true;
      }
      return false;
    }
  }, [
    isMountedRef, 
    loadParticipantsFallback, 
    loadTeamsFallback, 
    loadActivitiesFallback,
    loadFailedRef,
    setParticipants, 
    setTeams, 
    setParticipantActivities
  ]);

  return {
    loadData,
    initialLoadCompleteRef,
    isMountedRef,
    loadFailedRef,
    cleanupResources
  };
};
