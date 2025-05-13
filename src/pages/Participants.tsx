
import { useState, useEffect } from "react";
import { useParticipants } from "@/hooks/useParticipants";
import { toast } from "sonner";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";

// Components
import LoadingIndicator from "@/components/dashboard/LoadingIndicator";
import AddParticipantDialog from "@/components/participants/AddParticipantDialog";
import TeamAssignmentDialog from "@/components/participants/TeamAssignmentDialog";
import ParticipantsHeader from "@/components/participants/ParticipantsHeader";
import ParticipantsGrid from "@/components/participants/ParticipantsGrid";
import RefreshingIndicator from "@/components/participants/RefreshingIndicator";
import ErrorDisplay from "@/components/participants/ErrorDisplay";
import { Participant } from "@/types";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const Participants = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
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
  const showEmptyState = !isLoading && initialLoadAttempted && participants.length === 0 && !loadError;
  
  // Use our navigation guard to prevent unwanted navigation during loading
  useNavigationGuard('/participants', isLoading || refreshing);
  
  // Effect to ensure we stay on this page when loading data
  useEffect(() => {
    // This prevents navigation away from the participants page
    // when the component is mounted on the participants route
    if (location.pathname === '/participants') {
      console.log("Ensuring we stay on participants page");
      
      // Set a flag in sessionStorage to track that we're on this page intentionally
      sessionStorage.setItem('viewing_participants', 'true');
      
      // Clear any pending navigation timeouts
      const timeoutIds = sessionStorage.getItem('pending_navigation_timeouts');
      if (timeoutIds) {
        const ids = JSON.parse(timeoutIds);
        ids.forEach(id => clearTimeout(id));
        sessionStorage.removeItem('pending_navigation_timeouts');
      }
    }
    
    return () => {
      // Only remove the flag if we're actually navigating away
      if (location.pathname !== '/participants') {
        sessionStorage.removeItem('viewing_participants');
      }
    };
  }, [location.pathname]);
  
  // Trigger an initial load if not loading and no data
  useEffect(() => {
    if (!isLoading && !refreshing && !hasShownData && initialLoadAttempted) {
      // Small delay before trying again
      const timer = setTimeout(() => {
        console.log("Triggering refresh after delay - no data shown yet");
        handleManualRefresh();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, refreshing, hasShownData, initialLoadAttempted]);

  // Add a listener to detect unexpected navigation
  useEffect(() => {
    const handleVisibilityChange = () => {
      // If the page becomes hidden and we're on the participants page
      if (document.visibilityState === 'hidden' && location.pathname === '/participants') {
        // This means the user is navigating away - log this for debugging
        console.log("Page visibility changed while on participants page");
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);
  
  const handleTeamDialogOpen = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsTeamDialogOpen(true);
  };
  
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
        
        <div className="flex justify-center">
          <Button
            onClick={handleManualRefresh}
            variant="outline"
            className="mb-4"
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Try Again"}
          </Button>
        </div>
        
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
  if (showEmptyState) {
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
          onSuccess={() => loadData(true)}
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
