import { useState, useRef } from "react";
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
  
  // Add a loading ref to prevent concurrent loads
  const loadingRef = useRef(false);

  const loadParticipantsData = async (options = {}) => {
    try {
      // Check if we're already loading
      if (loadingRef.current) {
        console.log("Already loading participants data");
        return participants;
      }

      console.log("Fetching participants data from Supabase");
      
      const now = Date.now();
      const recentDataAvailable = lastLoadTime && 
                                 (now - lastLoadTime < 30000) && 
                                 participants.length > 0;
                                 
      if (recentDataAvailable && !options['forceFresh']) {
        console.log("Using cached participants data");
        return participants;
      }
      
      loadingRef.current = true;
      
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*');
      
      if (participantsError) throw participantsError;
      
      setLastLoadTime(now);
      return participantsData || [];
    } catch (error) {
      console.error("Error fetching participants:", error);
      return participants.length > 0 ? participants : [];
    } finally {
      loadingRef.current = false;
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
