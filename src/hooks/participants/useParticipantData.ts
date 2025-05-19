import { useState } from "react";
import { Participant, Team, Activity } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook for fetching participant data from Supabase
 */
export const useParticipantData = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [participantActivities, setParticipantActivities] = useState<Record<string, Activity[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastLoadTime, setLastLoadTime] = useState<number | null>(null);

  const loadParticipantsData = async (options = {}) => {
    try {
      console.log("Fetching participants data from Supabase");
      
      // Check if we've loaded data recently (in the past 10 seconds) and have data
      const now = Date.now();
      const recentDataAvailable = lastLoadTime && 
                                 (now - lastLoadTime < 10000) && 
                                 participants.length > 0;
                                 
      if (recentDataAvailable && !options['forceFresh']) {
        console.log("Using recently loaded participants data");
        return participants;
      }
      
      // Load participants from Supabase with abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout (increased)
      
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*');
      
      clearTimeout(timeoutId);
      
      if (participantsError) {
        console.error("Error loading participants:", participantsError);
        throw participantsError;
      }
      
      // Update last load time
      setLastLoadTime(now);
      
      console.log(`Fetched ${participantsData?.length || 0} participants`);
      return participantsData || [];
    } catch (error) {
      console.error("Error fetching participants:", error);
      
      // Check if we have fallback data
      if (participants.length > 0) {
        console.log("Using existing participants data as fallback");
        return participants;
      }
      
      // Check if it's a network error
      if (error instanceof Error && 
          (error.message.includes("fetch") || 
           error.message.includes("network") || 
           error.message.includes("timeout") || 
           !navigator.onLine)) {
        console.log("Network connectivity issue detected in getParticipants");
        throw new Error("Network connectivity issue. Please check your internet connection and try again.");
      }
      
      // Fall back to local storage
      console.log("Falling back to local storage for participants data");
      const localData = localStorage.getItem('participants_cache');
      const parsedData = localData ? JSON.parse(localData) : [];
      return parsedData;
    }
  };

  const loadTeamMembersData = async (options = {}) => {
    try {
      console.log("Fetching team members data from Supabase");
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('team_members')
        .select('*');
      
      if (teamMembersError) {
        console.error("Error loading team members:", teamMembersError);
        throw teamMembersError;
      }
      
      console.log(`Fetched ${teamMembersData?.length || 0} team members`);
      return teamMembersData || [];
    } catch (error) {
      console.error("Error fetching team members:", error);
      // Return empty array instead of throwing
      return [];
    }
  };

  const loadTeamsData = async (options = {}) => {
    try {
      console.log("Fetching teams data from Supabase");
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*');
      
      if (teamsError) {
        console.error("Error loading teams:", teamsError);
        throw teamsError;
      }
      
      console.log(`Fetched ${teamsData?.length || 0} teams`);
      return teamsData.map(team => ({
        id: team.id,
        name: team.name,
        color: team.color
      })) || [];
    } catch (error) {
      console.error("Error fetching teams:", error);
      // Return empty array instead of throwing
      return [];
    }
  };

  const loadActivitiesData = async (options = {}) => {
    try {
      console.log("Fetching activities data from Supabase");
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*');
      
      if (activitiesError) {
        console.error("Error loading activities:", activitiesError);
        throw activitiesError;
      }
      
      console.log(`Fetched ${activitiesData?.length || 0} activities`);
      return activitiesData || [];
    } catch (error) {
      console.error("Error fetching activities:", error);
      // Return empty array instead of throwing
      return [];
    }
  };

  return {
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
    setIsLoading,
    lastLoadTime,
    setLastLoadTime
  };
};
