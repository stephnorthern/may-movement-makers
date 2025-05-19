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
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ParticipantSkeletons />
      </div>
    );
  }

  if (!participants || participants.length === 0) {
    return <EmptyParticipantsList onAddParticipant={onAddParticipant} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {participants.map((participant) => {
        if (!participant?.id) return null;
        
        // Safely access activities with fallback
        const activities = participantActivities?.[participant.id] || [];
        const team = participant?.teamId ? getTeamById(participant.teamId) : null;
        
        return (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            activities={activities}
            team={team}
            onTeamChange={onTeamChange}
          />
        );
      })}
    </div>
  );
};

export default ParticipantsGrid;
