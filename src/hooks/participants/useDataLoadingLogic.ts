import { useCallback } from "react";
import { Activity } from "@/types";
import { toast } from "sonner";
import { useDataLoading } from "./useDataLoading";

/**
 * Hook containing the core logic for loading participant data
 */
export const useDataLoadingLogic = (
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
) => {
  const { loadParticipantsFallback, loadTeamsFallback, loadActivitiesFallback } = useDataLoading();

  /**
   * Load participant activities for all participants
   */
  const loadParticipantActivities = useCallback(async (participantsData) => {
    if (!isMountedRef?.current) return;
    
    // Load activities for each participant
    const activitiesMap: Record<string, Activity[]> = {};
    
    // Use Promise.allSettled to handle partial failures
    const activityPromises = participantsData.map(participant => 
      loadActivitiesForParticipant(participant.id, participant.name)
        .then(activities => {
          if (isMountedRef?.current) {
            activitiesMap[participant.id] = activities;
          }
        })
        .catch(e => {
          console.warn(`Error loading activities for ${participant.name}:`, e);
          activitiesMap[participant.id] = []; // Set empty array when activities fail to load
        })
    );
    
    // Wait for all promises to settle (success or failure)
    await Promise.allSettled(activityPromises);
    
    if (!isMountedRef?.current) return;
    
    setParticipantActivities(activitiesMap);
  }, [isMountedRef, loadActivitiesForParticipant, setParticipantActivities]);

  /**
   * Main data loading function - loads from Supabase with fallbacks to local storage
   * @param forceFresh - Force a fresh fetch, bypassing any caching
   */
  const loadData = useCallback(async (forceFresh = false) => {
    // Guard against undefined refs and concurrent loads
    if (!isMountedRef?.current) {
      console.log("Skipping load - component unmounted");
      return;
    }
    
    if (isLoadingRef?.current) {
      console.log("Skipping load - already loading");
      return;
    }
    
    try {
      startLoading();
      isLoadingRef.current = true;
      console.log("Starting data load from Supabase, forceFresh:", forceFresh);
      
      // Load data sequentially
      const participantsData = await loadParticipantsData({ forceFresh });
      if (!isMountedRef?.current) return;
      
      const teamMembersData = await loadTeamMembersData({ forceFresh });
      if (!isMountedRef?.current) return;
      
      const teamsData = await loadTeamsData({ forceFresh });
      if (!isMountedRef?.current) return;
      
      const activitiesData = await loadActivitiesData({ forceFresh });
      if (!isMountedRef?.current) return;
      
      console.log("Data fetch results:", {
        participantsSuccess: !!participantsData,
        teamMembersSuccess: !!teamMembersData,
        teamsSuccess: !!teamsData, 
        activitiesSuccess: !!activitiesData,
        participantsCount: participantsData?.length || 0,
        teamsCount: teamsData?.length || 0
      });
      
      // If critical data is missing, try fallback method
      if (!participantsData || !teamsData) {
        console.warn("Critical data missing, trying fallback method");
        // Store any errors for later analysis
        const errors = [
          !participantsData ? 'Failed to load participants' : null,
          !teamsData ? 'Failed to load teams' : null
        ].filter(Boolean);
        
        if (errors.length > 0) {
          throw new Error("Failed to load essential data: " + 
            errors.map(e => typeof e === 'object' && e !== null ? e!.toString() : String(e)).join(', '));
        } else {
          throw new Error("Failed to load essential data");
        }
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
      
      if (!isMountedRef?.current) return;
      
      console.log("Setting participants data:", sortedData.length);
      setParticipants(sortedData);
      
      console.log("Setting teams data:", teamsData.length);
      setTeams(teamsData);
      
      // Store data in localStorage for offline fallback
      localStorage.setItem('participants_cache', JSON.stringify(sortedData));
      localStorage.setItem('teams_cache', JSON.stringify(teamsData));
      
      // Try to load participant activities but don't fail if they don't load
      try {
        await loadParticipantActivities(participantsWithPoints);
      } catch (activityError) {
        console.warn("Failed to load some participant activities:", activityError);
        // This is non-critical, so we continue
      }
      
      initialLoadCompleteRef.current = true;
      loadFailedRef.current = false; // Reset failure flag on success
      
      // Loading completed successfully
      console.log("Data loading completed successfully");
      return true;
    } catch (error) {
      console.error("Error loading data:", error);
      if (!loadFailedRef.current) {
        toast.error("Failed to load data");
        loadFailedRef.current = true;
      }
      return false;
    } finally {
      if (isMountedRef?.current) {
        isLoadingRef.current = false;
        endLoading();
      }
    }
  }, [
    loadParticipantsData,
    loadTeamMembersData,
    loadTeamsData,
    loadActivitiesData,
    setParticipants,
    setTeams,
    isMountedRef,
    isLoadingRef,
    startLoading,
    endLoading,
    loadFailedRef,
    initialLoadCompleteRef,
    loadParticipantActivities
  ]);

  /**
   * Fallback method to load data from local storage
   */
  const loadDataFallback = useCallback(async () => {
    try {
      console.log("Attempting fallback data loading method");
      
      // Try to get cached data first
      let participantsData = JSON.parse(localStorage.getItem('participants_cache') || 'null');
      let teamsData = JSON.parse(localStorage.getItem('teams_cache') || 'null');
      
      // If no cached data, try the fallback functions
      if (!participantsData) {
        participantsData = await loadParticipantsFallback();
      }
      
      if (!teamsData) {
        teamsData = await loadTeamsFallback();
      }
      
      if (!isMountedRef?.current) return false;
      
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
        if (!isMountedRef?.current) return false;
        
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
      
      if (!isMountedRef?.current) return false;
      
      setParticipantActivities(activitiesMap);
      initialLoadCompleteRef.current = true;
      loadFailedRef.current = false; // Reset failure flag on success
      return true;
    } catch (fallbackError) {
      if (!isMountedRef?.current) return false;
      
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
    loadParticipantActivities
  };
};
