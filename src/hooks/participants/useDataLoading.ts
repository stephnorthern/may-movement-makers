
import { useCallback } from "react";
import { Activity } from "@/types";
import { getParticipants } from "@/lib/api/participants";
import { getTeams } from "@/lib/api/teams";
import { getParticipantActivities } from "@/lib/api/activities";
import { toast } from "sonner";

/**
 * Hook providing data loading functions with fallbacks
 */
export const useDataLoading = () => {
  /**
   * Fallback method to load participants when Supabase fails
   */
  const loadParticipantsFallback = useCallback(async () => {
    try {
      const participants = await getParticipants();
      console.log("Fallback loaded participants:", participants.length);
      return participants;
    } catch (fallbackError) {
      console.error("Fallback error loading participants:", fallbackError);
      toast.error("All participant loading methods failed");
      return [];
    }
  }, []);

  /**
   * Fallback method to load teams when Supabase fails
   */
  const loadTeamsFallback = useCallback(async () => {
    try {
      const teams = await getTeams();
      console.log("Fallback loaded teams:", teams.length);
      return teams;
    } catch (fallbackError) {
      console.error("Fallback error loading teams:", fallbackError);
      toast.error("All team loading methods failed");
      return [];
    }
  }, []);

  /**
   * Fallback method to load activities when Supabase fails
   */
  const loadActivitiesFallback = useCallback(
    async (participantId: string): Promise<Activity[]> => {
      try {
        const activities = await getParticipantActivities(participantId);
        console.log(`Fallback loaded activities for ${participantId}:`, activities.length);
        return activities;
      } catch (fallbackActivityError) {
        console.error(
          `Error loading activities for participant ${participantId}:`,
          fallbackActivityError
        );
        return [];
      }
    },
    []
  );

  return {
    loadParticipantsFallback,
    loadTeamsFallback,
    loadActivitiesFallback,
  };
};
