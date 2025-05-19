
import { Team } from "@/types";

/**
 * Hook for team-related utility functions
 */
export const useTeamUtils = (teams: Team[]) => {
  /**
   * Gets a team by its ID
   */
  const getTeamById = (teamId?: string) => {
    if (!teamId) return null;
    return teams.find(team => team.id === teamId) || null;
  };

  return {
    getTeamById
  };
};
