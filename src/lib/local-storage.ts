
// This file re-exports all functions from the API modules for backward compatibility

// Re-export participant functions
export { 
  getParticipants,
  getParticipant,
  addParticipant,
  updateParticipantStats,
  assignParticipantToTeam,
  updateParticipantStatsInSupabase
} from "./api/participants";

// Re-export team functions
export {
  getTeams,
  getTeam,
  addTeam,
  updateTeam,
  deleteTeam
} from "./api/teams";

// Re-export activity functions
export {
  getActivities,
  getParticipantActivities,
  addActivity,
  deleteActivity
} from "./api/activities";

// Re-export utility functions
export { calculatePoints } from "./utils/calculations";
