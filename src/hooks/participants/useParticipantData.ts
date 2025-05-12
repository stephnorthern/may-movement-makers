
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

  const loadParticipantsData = async (options = {}) => {
    try {
      console.log("Fetching participants data from Supabase");
      // Load participants from Supabase
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*');
      
      if (participantsError) {
        console.error("Error loading participants:", participantsError);
        throw participantsError;
      }
      
      console.log(`Fetched ${participantsData?.length || 0} participants`);
      return participantsData || [];
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to load participants data");
      throw error;
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
      }));
    } catch (error) {
      console.error("Error fetching teams:", error);
      throw error;
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
    setIsLoading
  };
};
