
import { useState, useEffect } from "react";
import { useParticipants } from "@/hooks/useParticipants";
import { toast } from "sonner";

// Components
import LoadingIndicator from "@/components/dashboard/LoadingIndicator";
import AddParticipantDialog from "@/components/participants/AddParticipantDialog";
import TeamAssignmentDialog from "@/components/participants/TeamAssignmentDialog";
import ParticipantsHeader from "@/components/participants/ParticipantsHeader";
import ParticipantsGrid from "@/components/participants/ParticipantsGrid";
import RefreshingIndicator from "@/components/participants/RefreshingIndicator";
import ErrorDisplay from "@/components/participants/ErrorDisplay";
import { Participant } from "@/types";

const Participants = () => {
  const {
    participants,
    teams,
    participantActivities,
    isLoading,
    initialLoadAttempted,
    loadError,
    loadData,
    getTeamById,
    retryLoading,
    refreshing,
    handleManualRefresh
  } = useParticipants();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  
  // Flag to track if we've shown data at least once
  const hasShownData = participants.length > 0;
  const showEmptyState = !isLoading && initialLoadAttempted && participants.length === 0;

  const handleTeamDialogOpen = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsTeamDialogOpen(true);
  };
  
  // Debug information
  useEffect(() => {
    console.log("Participants page state:", {
      isLoading,
      initialLoadAttempted,
      participantsCount: participants.length,
      teamsCount: teams.length,
      hasError: !!loadError,
      hasParticipantActivities: Object.keys(participantActivities).length > 0
    });
    
    if (loadError) {
      console.error("Load error details:", loadError);
    }
    
    if (participants.length > 0) {
      console.log("First participant:", participants[0]);
    }
  }, [isLoading, initialLoadAttempted, participants, teams, loadError, participantActivities]);

  // Force a refresh on initial render
  useEffect(() => {
    // Small delay to allow component to mount fully
    const timer = setTimeout(() => {
      if (!hasShownData && !refreshing) {
        handleManualRefresh();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Render initial loading state
  if (isLoading && !hasShownData) {
    return (
      <div className="space-y-6">
        <ParticipantsHeader 
          participantsCount={0}
          onOpenAddDialog={() => setIsDialogOpen(true)}
          onRefresh={handleManualRefresh}
          refreshing={refreshing}
        />
        <div className="flex justify-center py-16">
          <LoadingIndicator error={loadError} retryFn={handleManualRefresh} />
        </div>
      </div>
    );
  }

  // Render error state if loading failed
  if (loadError && initialLoadAttempted && !hasShownData) {
    return (
      <div className="space-y-6">
        <ParticipantsHeader 
          participantsCount={0}
          onOpenAddDialog={() => setIsDialogOpen(true)}
          onRefresh={handleManualRefresh}
          refreshing={refreshing}
        />
        
        <ErrorDisplay 
          error={loadError} 
          onRetry={handleManualRefresh}
          refreshing={refreshing}
        />
        
        <AddParticipantDialog 
          teams={teams}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={() => loadData(true)}
        />
      </div>
    );
  }

  // Render empty state if no data after attempted load
  if (showEmptyState && initialLoadAttempted && !isLoading) {
    return (
      <div className="space-y-6">
        <ParticipantsHeader 
          participantsCount={0}
          onOpenAddDialog={() => setIsDialogOpen(true)}
          onRefresh={handleManualRefresh}
          refreshing={refreshing}
        />
        
        <ParticipantsGrid
          participants={[]}
          participantActivities={participantActivities}
          getTeamById={getTeamById}
          isLoading={false}
          onTeamChange={handleTeamDialogOpen}
          onAddParticipant={() => setIsDialogOpen(true)}
        />
        
        <AddParticipantDialog 
          teams={teams}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={loadData}
        />
      </div>
    );
  }
  
  // Default render for participants list
  return (
    <div className="space-y-6">
      <ParticipantsHeader 
        participantsCount={participants.length}
        onOpenAddDialog={() => setIsDialogOpen(true)}
        onRefresh={handleManualRefresh}
        refreshing={refreshing}
      />
      
      <RefreshingIndicator refreshing={refreshing} hasData={hasShownData} />
      
      <ParticipantsGrid
        participants={participants}
        participantActivities={participantActivities}
        getTeamById={getTeamById}
        isLoading={isLoading}
        onTeamChange={handleTeamDialogOpen}
        onAddParticipant={() => setIsDialogOpen(true)}
      />
      
      {/* Dialogs */}
      <AddParticipantDialog 
        teams={teams}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => loadData(true)}
      />
      
      <TeamAssignmentDialog 
        isOpen={isTeamDialogOpen}
        onOpenChange={setIsTeamDialogOpen}
        selectedParticipant={selectedParticipant}
        teams={teams}
        onSuccess={() => {
          loadData(true);
          setSelectedParticipant(null);
        }}
      />
    </div>
  );
};

export default Participants;
