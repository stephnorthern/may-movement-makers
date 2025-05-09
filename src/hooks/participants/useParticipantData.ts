
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

  const loadParticipantsData = async () => {
    try {
      // Load participants from Supabase
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*');
      
      if (participantsError) {
        console.error("Error loading participants:", participantsError);
        throw participantsError;
      }
      
      return participantsData;
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to load participants data");
      return [];
    }
  };

  const loadTeamMembersData = async () => {
    try {
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('team_members')
        .select('*');
      
      if (teamMembersError) {
        console.error("Error loading team members:", teamMembersError);
      }
      
      return teamMembersData || [];
    } catch (error) {
      console.error("Error fetching team members:", error);
      return [];
    }
  };

  const loadTeamsData = async () => {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*');
      
      if (teamsError) {
        console.error("Error loading teams:", teamsError);
        throw teamsError;
      }
      
      return teamsData.map(team => ({
        id: team.id,
        name: team.name,
        color: team.color
      }));
    } catch (error) {
      console.error("Error fetching teams:", error);
      return [];
    }
  };

  const loadActivitiesData = async () => {
    try {
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*');
      
      if (activitiesError) {
        console.error("Error loading activities:", activitiesError);
      }
      
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
