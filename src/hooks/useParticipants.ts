
import { useCallback, useEffect } from "react";
import { getActivities, getParticipantActivities } from "@/lib/api/activities";
import { getParticipants } from "@/lib/api/participants";
import { getTeams } from "@/lib/api/teams";
import { toast } from "sonner";

// Import refactored hooks
import { useParticipantData } from "./participants/useParticipantData";
import { useParticipantActivities } from "./participants/useParticipantActivities";
import { useRealtimeUpdates } from "./participants/useRealtimeUpdates";
import { useTeamUtils } from "./participants/useTeamUtils";

export const useParticipants = () => {
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
  
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load data from Supabase
      const participantsData = await loadParticipantsData();
      const teamMembersData = await loadTeamMembersData();
      const teamsData = await loadTeamsData();
      const activitiesData = await loadActivitiesData();
      
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
      
      setParticipants(sortedData);
      setTeams(teamsData);
      
      // Load activities for each participant
      const activitiesMap = {};
      for (const participant of participantsWithPoints) {
        try {
          const activities = await loadActivitiesForParticipant(
            participant.id,
            participant.name
          );
          activitiesMap[participant.id] = activities;
        } catch (e) {
          console.error(`Error processing activities for participant ${participant.id}:`, e);
        }
      }
      
      setParticipantActivities(activitiesMap);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
      
      // Fall back to original implementation if Supabase fails
      try {
        const participantsData = await getParticipants();
        const teamsData = await getTeams();
        
        // Sort by points (highest first)
        const sortedData = [...participantsData].sort((a, b) => b.points - a.points);
        setParticipants(sortedData);
        setTeams(teamsData);
        
        // Load activities for each participant
        const activitiesMap = {};
        for (const participant of participantsData) {
          const activities = await getParticipantActivities(participant.id);
          activitiesMap[participant.id] = activities;
        }
        setParticipantActivities(activitiesMap);
      } catch (fallbackError) {
        console.error("Error in fallback loading:", fallbackError);
        toast.error("All data loading methods failed");
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    loadParticipantsData, 
    loadTeamMembersData, 
    loadTeamsData, 
    loadActivitiesData,
    loadActivitiesForParticipant,
    setParticipants,
    setTeams,
    setParticipantActivities, 
    setIsLoading
  ]);
  
  // Set up realtime updates
  useRealtimeUpdates(loadData);
  
  // Load data on initial mount
  useEffect(() => {
    loadData();
  }, [loadData]);
  
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
