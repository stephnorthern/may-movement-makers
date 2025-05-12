
import { useState } from "react";
import { Participant } from "@/types";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { useParticipants } from "@/hooks/useParticipants";
import ParticipantCard from "@/components/participants/ParticipantCard";
import EmptyParticipantsList from "@/components/participants/EmptyParticipantsList";
import AddParticipantDialog from "@/components/participants/AddParticipantDialog";
import TeamAssignmentDialog from "@/components/participants/TeamAssignmentDialog";
import LoadingIndicator from "@/components/dashboard/LoadingIndicator";
import { Skeleton } from "@/components/ui/skeleton";

const Participants = () => {
  const {
    participants,
    teams,
    participantActivities,
    isLoading,
    loadData,
    getTeamById
  } = useParticipants();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  
  // Flag to track if we've shown data at least once
  const hasShownData = participants.length > 0;
  
  const handleTeamDialogOpen = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsTeamDialogOpen(true);
  };
  
  // Render initial loading state more elegantly
  if (isLoading && !hasShownData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Participants</h1>
            <p className="text-gray-600">View and manage all challenge participants</p>
          </div>
        </div>
        <div className="flex justify-center py-16">
          <LoadingIndicator />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Participants</h1>
          <p className="text-gray-600">View and manage all challenge participants</p>
        </div>
        
        <Button 
          className="bg-movement-purple hover:bg-movement-dark-purple"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Participant
        </Button>
      </div>
      
      {/* Show a non-flashing loading message only when refreshing data */}
      {isLoading && hasShownData && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-3 text-sm flex items-center opacity-80 fixed top-4 right-4 shadow-md z-50">
          <div className="mr-2 h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
          Refreshing data...
        </div>
      )}
      
      {/* Show the participants grid */}
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
                onTeamChange={handleTeamDialogOpen}
              />
            );
          })
        ) : (
          <EmptyParticipantsList onAddParticipant={() => setIsDialogOpen(true)} />
        )}
      </div>
      
      {/* Dialogs */}
      <AddParticipantDialog 
        teams={teams}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={loadData}
      />
      
      <TeamAssignmentDialog 
        teams={teams}
        isOpen={isTeamDialogOpen}
        onOpenChange={setIsTeamDialogOpen}
        selectedParticipant={selectedParticipant}
        onSuccess={() => {
          loadData();
          setSelectedParticipant(null);
        }}
      />
    </div>
  );
};

export default Participants;
