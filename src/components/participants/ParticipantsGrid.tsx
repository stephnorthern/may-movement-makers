
import { Participant, Activity, Team } from "@/types";
import ParticipantCard from "./ParticipantCard";
import ParticipantSkeletons from "./ParticipantSkeletons";
import EmptyParticipantsList from "./EmptyParticipantsList";

interface ParticipantsGridProps {
  participants: Participant[];
  participantActivities: Record<string, Activity[]>;
  getTeamById: (teamId?: string) => Team | null;
  isLoading: boolean;
  onTeamChange: (participant: Participant) => void;
  onAddParticipant: () => void;
}

const ParticipantsGrid = ({
  participants,
  participantActivities,
  getTeamById,
  isLoading,
  onTeamChange,
  onAddParticipant
}: ParticipantsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {participants.length > 0 ? (
        participants.map((participant) => {
          const activities = participantActivities[participant.id] || [];
          const team = getTeamById(participant.teamId);
          
          return (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              activities={activities}
              team={team}
              onTeamChange={onTeamChange}
            />
          );
        })
      ) : isLoading ? (
        <ParticipantSkeletons />
      ) : (
        <EmptyParticipantsList onAddParticipant={onAddParticipant} />
      )}
    </div>
  );
};

export default ParticipantsGrid;
