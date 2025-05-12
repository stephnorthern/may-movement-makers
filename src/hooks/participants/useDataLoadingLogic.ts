
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
  setParticipantActivities
) => {
  const { loadParticipantsFallback, loadTeamsFallback, loadActivitiesFallback } = useDataLoading();

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
      
      // Use Promise.allSettled to continue even if some requests fail
      const [participantsResult, teamMembersResult, teamsResult, activitiesResult] = await Promise.allSettled([
        loadParticipantsData(options),
        loadTeamMembersData(options),
        loadTeamsData(options),
        loadActivitiesData(options)
      ]);
      
      if (!isMountedRef.current) return;
      
      // Extract results or handle errors
      const participantsData = participantsResult.status === 'fulfilled' ? participantsResult.value : null;
      const teamMembersData = teamMembersResult.status === 'fulfilled' ? teamMembersResult.value : null;
      const teamsData = teamsResult.status === 'fulfilled' ? teamsResult.value : null;
      const activitiesData = activitiesResult.status === 'fulfilled' ? activitiesResult.value : null;
      
      console.log("Data fetch results:", {
        participantsSuccess: participantsResult.status === 'fulfilled',
        teamMembersSuccess: teamMembersResult.status === 'fulfilled',
        teamsSuccess: teamsResult.status === 'fulfilled', 
        activitiesSuccess: activitiesResult.status === 'fulfilled',
        participantsCount: participantsData?.length || 0,
        teamsCount: teamsData?.length || 0
      });
      
      // If critical data is missing, try fallback method
      if (!participantsData || !teamsData) {
        console.warn("Critical data missing, trying fallback method");
        // Store any errors for later analysis
        const errors = [
          participantsResult.status === 'rejected' ? participantsResult.reason : null,
          teamsResult.status === 'rejected' ? teamsResult.reason : null
        ].filter(Boolean);
        
        if (errors.length > 0) {
          throw new Error("Failed to load essential data: " + 
            errors.map(e => e instanceof Error ? e.message : String(e)).join(', '));
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
      
      if (!isMountedRef.current) return;
      
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
    
    // Use Promise.allSettled to handle partial failures
    const activityPromises = participantsData.map(participant => 
      loadActivitiesForParticipant(participant.id, participant.name)
        .then(activities => {
          if (isMountedRef.current) {
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
    
    if (!isMountedRef.current) return;
    
    setParticipantActivities(activitiesMap);
  }, [isMountedRef, loadActivitiesForParticipant, setParticipantActivities]);
  
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
    loadParticipantActivities
  };
};
