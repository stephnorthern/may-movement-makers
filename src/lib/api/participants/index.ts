
// Main export file that re-exports everything for backward compatibility
import { getParticipants } from './queries';
import { getParticipant } from './queries';
import { addParticipant } from './mutations';
import { updateParticipantStats, updateParticipantStatsInSupabase } from './mutations';
import { assignParticipantToTeam } from './mutations';

export {
  getParticipants,
  getParticipant,
  addParticipant,
  updateParticipantStats,
  updateParticipantStatsInSupabase,
  assignParticipantToTeam
};
