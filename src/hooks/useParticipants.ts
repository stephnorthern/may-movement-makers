
import { useCallback, useEffect, useState, useRef } from "react";
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
  
  // Ref to track if initial data load has completed
  const initialLoadCompleteRef = useRef(false);
  
  // Ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    try {
      // Load data from Supabase
      const participantsData = await loadParticipantsData();
      const teamMembersData = await loadTeamMembersData();
      const teamsData = await loadTeamsData();
      const activitiesData = await loadActivitiesData();
      
      if (!isMountedRef.current) return;
      
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
      
      setParticipants(sortedData);
      setTeams(teamsData);
      
      // Load activities for each participant
      const activitiesMap = {};
      for (const participant of participantsWithPoints) {
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
      initialLoadCompleteRef.current = true;
    } catch (error) {
      if (!isMountedRef.current) return;
      
      console.error("Error loading data:", error);
      toast.error("Failed to load data, trying fallback method");
      
      // Fall back to original implementation if Supabase fails
      try {
        const participantsData = await getParticipants();
        const teamsData = await getTeams();
        
        if (!isMountedRef.current) return;
        
        if (!participantsData || !teamsData) {
          throw new Error("Failed to load data from fallback");
        }
        
        // Sort by points (highest first)
        const sortedData = [...participantsData].sort((a, b) => b.points - a.points);
        setParticipants(sortedData);
        setTeams(teamsData);
        
        // Load activities for each participant
        const activitiesMap = {};
        for (const participant of participantsData) {
          if (!isMountedRef.current) return;
          
          try {
            const activities = await getParticipantActivities(participant.id);
            activitiesMap[participant.id] = activities;
          } catch (fallbackActivityError) {
            console.error(`Error loading activities for participant ${participant.id}:`, fallbackActivityError);
            activitiesMap[participant.id] = []; // Set empty array when activities fail to load
          }
        }
        
        if (!isMountedRef.current) return;
        
        setParticipantActivities(activitiesMap);
        initialLoadCompleteRef.current = true;
      } catch (fallbackError) {
        if (!isMountedRef.current) return;
        
        console.error("Error in fallback loading:", fallbackError);
        toast.error("All data loading methods failed");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
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
    isMountedRef.current = true;
    
    // When component unmounts
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
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
